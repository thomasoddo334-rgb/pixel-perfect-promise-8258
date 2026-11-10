// Offline-first vehicle store: memory + IndexedDB, synced with Lovable Cloud when online.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDb, getMeta, setMeta, type LocalVehicle } from "./local-db";
import {
  PHOTO_COUNT,
  generateReference,
  newVehicle,
  normalizePhotos,
  photoStoragePath,
  type Publication,
  type Vehicle,
} from "./model";
import { resizePhoto } from "./images";

export const PHOTO_BUCKET = "van-photos";

export type SyncInfo = {
  online: boolean;
  syncing: boolean;
  pendingVehicles: number;
  pendingPhotos: number;
  lastSyncedAt: string | null;
  error: string | null;
};
type Snapshot = { loaded: boolean; vehicles: LocalVehicle[]; sync: SyncInfo };

const vehicles = new Map<string, LocalVehicle>();
const pendingPhotoIds = new Set<string>();
let loaded = false;
let syncing = false;
let rerun = false;
let lastSyncedAt: string | null = null;
let lastError: string | null = null;
let online = true;
let currentUser: { id: string; name: string } | null = null;

const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: Snapshot = {
  loaded: false,
  vehicles: [],
  sync: { online: true, syncing: false, pendingVehicles: 0, pendingPhotos: 0, lastSyncedAt: null, error: null },
};
let snapshot: Snapshot = SERVER_SNAPSHOT;

function emit() {
  const list = [...vehicles.values()].filter((v) => !v.deleted);
  snapshot = {
    loaded,
    vehicles: list,
    sync: {
      online,
      syncing,
      pendingVehicles: [...vehicles.values()].filter((v) => v._dirty === 1).length,
      pendingPhotos: pendingPhotoIds.size,
      lastSyncedAt,
      error: lastError,
    },
  };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useVans(): Snapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);
}

export function useVehicle(id: string): LocalVehicle | undefined {
  const snap = useVans();
  return snap.vehicles.find((v) => v.id === id);
}

// Serialize IndexedDB writes so the latest edit always lands last.
let writeChain: Promise<unknown> = Promise.resolve();
function persist(v: LocalVehicle) {
  writeChain = writeChain.then(async () => (await getDb()).put("vehicles", v)).catch((e) => console.error(e));
  return writeChain;
}

let initPromise: Promise<void> | null = null;
export function initVanStore(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = (async () => {
    online = navigator.onLine;
    const db = await getDb();
    for (const v of await db.getAll("vehicles")) vehicles.set(v.id, { ...v, photos: normalizePhotos(v.photos) });
    for (const key of await db.getAllKeysFromIndex("photos", "by-uploaded", 0)) pendingPhotoIds.add(key);
    lastSyncedAt = (await getMeta<string>("lastSyncedAt")) ?? null;
    loaded = true;
    emit();

    window.addEventListener("online", () => {
      online = true;
      emit();
      void syncNow();
    });
    window.addEventListener("offline", () => {
      online = false;
      emit();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void syncNow();
    });
    window.setInterval(() => {
      if (document.visibilityState === "visible") void syncNow();
    }, 20000);
  })();
  return initPromise;
}

export function setSyncUser(user: { id: string; name: string } | null) {
  currentUser = user;
  if (user) void syncNow();
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSync(delay = 1200) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void syncNow(), delay);
}

// ---------- Local edits ----------

function touch(cur: LocalVehicle, patch: Partial<Vehicle>): LocalVehicle {
  return {
    ...cur,
    ...patch,
    updated_at: new Date().toISOString(),
    updated_by: currentUser?.id ?? cur.updated_by,
    updated_by_name: currentUser?.name ?? cur.updated_by_name,
    _dirty: 1,
  };
}

export function updateVehicle(id: string, patch: Partial<Vehicle>) {
  const cur = vehicles.get(id);
  if (!cur) return;
  const next = touch(cur, patch);
  vehicles.set(id, next);
  emit();
  void persist(next);
  scheduleSync();
}

export function createVehicle(): string {
  const id = crypto.randomUUID();
  const reference = generateReference([...vehicles.values()].map((v) => v.reference));
  const v: LocalVehicle = {
    ...newVehicle({
      id,
      reference,
      now: new Date().toISOString(),
      userId: currentUser?.id ?? null,
      userName: currentUser?.name ?? null,
    }),
    _dirty: 1,
  };
  vehicles.set(id, v);
  emit();
  void persist(v);
  scheduleSync();
  return id;
}

export function deleteVehicle(id: string) {
  updateVehicle(id, { deleted: true });
}

export function setPublication(id: string, publication: Publication) {
  updateVehicle(id, { publication });
}

async function queueRemoteDeletion(vehicleId: string, photoId: string) {
  const db = await getDb();
  const local = await db.get("photos", photoId);
  await db.delete("photos", photoId);
  pendingPhotoIds.delete(photoId);
  // Only uploaded photos exist remotely.
  if (!local || local.uploaded === 1) {
    await db.put("deletions", { path: photoStoragePath(vehicleId, photoId) });
  }
}

export async function setPhoto(vehicleId: string, slot: number, file: Blob) {
  const blob = await resizePhoto(file);
  const photoId = crypto.randomUUID();
  const db = await getDb();
  await db.put("photos", { id: photoId, vehicleId, blob, uploaded: 0, createdAt: new Date().toISOString() });
  pendingPhotoIds.add(photoId);
  const cur = vehicles.get(vehicleId);
  if (!cur) return;
  const photos = normalizePhotos(cur.photos);
  const previous = photos[slot]?.id;
  photos[slot] = { id: photoId, na: false };
  updateVehicle(vehicleId, { photos });
  if (previous) await queueRemoteDeletion(vehicleId, previous);
}

export async function addPhotos(vehicleId: string, files: File[]): Promise<{ added: number; skipped: number }> {
  let added = 0;
  for (const file of files) {
    const cur = vehicles.get(vehicleId);
    if (!cur) break;
    const photos = normalizePhotos(cur.photos);
    const slot = photos.findIndex((p) => !p.id && !p.na);
    if (slot === -1) break;
    await setPhoto(vehicleId, slot, file);
    added++;
  }
  return { added, skipped: files.length - added };
}

export async function removePhoto(vehicleId: string, slot: number) {
  const cur = vehicles.get(vehicleId);
  if (!cur) return;
  const photos = normalizePhotos(cur.photos);
  const previous = photos[slot]?.id;
  photos[slot] = { id: null, na: false };
  updateVehicle(vehicleId, { photos });
  if (previous) await queueRemoteDeletion(vehicleId, previous);
}

export function setPhotoNotConcerned(vehicleId: string, slot: number, na: boolean) {
  if (slot === 0) return;
  const cur = vehicles.get(vehicleId);
  if (!cur) return;
  const photos = normalizePhotos(cur.photos);
  if (photos[slot].id && na) return;
  photos[slot] = { id: null, na };
  updateVehicle(vehicleId, { photos });
}

export function getAllVehicles(): LocalVehicle[] {
  return [...vehicles.values()].filter((v) => !v.deleted);
}

// ---------- Sync ----------

function toRow(v: LocalVehicle) {
  const { _dirty, ...row } = v;
  void _dirty;
  return { ...row, photos: normalizePhotos(row.photos) };
}

function fromRow(row: Record<string, unknown>): LocalVehicle {
  const r = row as unknown as Vehicle & { server_updated_at?: string };
  const { server_updated_at, ...rest } = r;
  void server_updated_at;
  return {
    ...rest,
    equipements: Array.isArray(rest.equipements) ? rest.equipements : [],
    photos: normalizePhotos(rest.photos),
    publication: rest.publication === "pret" || rest.publication === "publie" ? rest.publication : null,
    _dirty: 0,
  };
}

async function uploadPhotos() {
  const db = await getDb();
  const pending = await db.getAllFromIndex("photos", "by-uploaded", 0);
  const referenced = new Set<string>();
  for (const v of vehicles.values()) for (const p of normalizePhotos(v.photos)) if (p.id) referenced.add(p.id);
  for (const p of pending) {
    if (!referenced.has(p.id) || !p.blob) {
      await db.delete("photos", p.id);
      pendingPhotoIds.delete(p.id);
      continue;
    }
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(photoStoragePath(p.vehicleId, p.id), p.blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw new Error(`Envoi photo : ${error.message}`);
    await db.put("photos", { ...p, uploaded: 1 });
    pendingPhotoIds.delete(p.id);
    emit();
  }
}

async function processDeletions() {
  const db = await getDb();
  const items = await db.getAll("deletions");
  if (!items.length) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(items.map((i) => i.path));
  if (error) return; // retried next time, never blocks data sync
  for (const i of items) await db.delete("deletions", i.path);
}

function markClean(row: { id: string; updated_at: string }) {
  const cur = vehicles.get(row.id);
  if (cur && cur.updated_at === row.updated_at && cur._dirty === 1) {
    const clean: LocalVehicle = { ...cur, _dirty: 0 };
    vehicles.set(row.id, clean);
    void persist(clean);
  }
}

async function pushVehicles() {
  const dirty = [...vehicles.values()].filter((v) => v._dirty === 1);
  if (!dirty.length) return;
  const rows = dirty.map(toRow);
  const { error } = await supabase.from("vehicles").upsert(rows as never, { onConflict: "id" });
  if (!error) {
    rows.forEach(markClean);
    emit();
    return;
  }
  // Batch failed: retry one by one so a single bad row never blocks the rest.
  let firstError: string | null = null;
  for (const row of rows) {
    const res = await supabase.from("vehicles").upsert(row as never, { onConflict: "id" });
    if (!res.error) {
      markClean(row);
      continue;
    }
    if (res.error.code === "23505" && res.error.message.includes("reference")) {
      const cur = vehicles.get(row.id);
      if (cur) updateVehicle(row.id, { reference: generateReference([...vehicles.values()].map((v) => v.reference)) });
      continue;
    }
    firstError ??= res.error.message;
  }
  emit();
  if (firstError) throw new Error(firstError);
}

async function pullVehicles() {
  const PAGE = 500;
  const stored = await getMeta<string>("lastPull");
  // Small overlap so rows committed during the previous pull are never missed.
  let since = stored ? new Date(Date.parse(stored) - 5000).toISOString() : "1970-01-01T00:00:00Z";
  let latest = stored ?? null;
  for (;;) {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .gt("server_updated_at", since)
      .order("server_updated_at", { ascending: true })
      .limit(PAGE);
    if (error) throw new Error(error.message);
    const db = await getDb();
    for (const row of data ?? []) {
      const remote = fromRow(row as Record<string, unknown>);
      const local = vehicles.get(remote.id);
      const remoteNewer = !local || Date.parse(remote.updated_at) > Date.parse(local.updated_at);
      const sameVersion = !!local && Date.parse(remote.updated_at) === Date.parse(local.updated_at);
      const take = !local || (local._dirty === 1 ? remoteNewer : !sameVersion || local.deleted !== remote.deleted);
      if (take) {
        vehicles.set(remote.id, remote);
        await db.put("vehicles", remote);
      }
    }
    if (data && data.length) {
      latest = (data[data.length - 1] as { server_updated_at: string }).server_updated_at;
      since = latest;
    }
    if (!data || data.length < PAGE) break;
  }
  if (latest) await setMeta("lastPull", latest);
  emit();
}

export async function syncNow(): Promise<void> {
  if (typeof window === "undefined" || !loaded || !currentUser) return;
  if (syncing) {
    rerun = true;
    return;
  }
  online = navigator.onLine;
  if (!online) {
    emit();
    return;
  }
  syncing = true;
  emit();
  try {
    await uploadPhotos();
    await processDeletions();
    await pushVehicles();
    await pullVehicles();
    lastSyncedAt = new Date().toISOString();
    await setMeta("lastSyncedAt", lastSyncedAt);
    lastError = null;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    console.warn("Sync", lastError);
  } finally {
    syncing = false;
    emit();
    if (rerun) {
      rerun = false;
      scheduleSync(300);
    } else if (lastError) {
      scheduleSync(15000);
    }
  }
}

export function photoSlotsFilled(v: Vehicle) {
  return normalizePhotos(v.photos).filter((p) => p.id).length + "/" + PHOTO_COUNT;
}
