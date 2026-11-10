// IndexedDB storage on the phone: vehicles, photo blobs, pending deletions, sync metadata.
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Vehicle } from "./model";

export type LocalVehicle = Vehicle & { _dirty: 0 | 1 };
export type LocalPhoto = {
  id: string;
  vehicleId: string;
  blob: Blob | null;
  uploaded: 0 | 1;
  createdAt: string;
};

interface VansDB extends DBSchema {
  vehicles: { key: string; value: LocalVehicle; indexes: { "by-dirty": number } };
  photos: { key: string; value: LocalPhoto; indexes: { "by-uploaded": number; "by-vehicle": string } };
  deletions: { key: string; value: { path: string } };
  meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<VansDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<VansDB>("fiches-vans", 1, {
      upgrade(db) {
        const v = db.createObjectStore("vehicles", { keyPath: "id" });
        v.createIndex("by-dirty", "_dirty");
        const p = db.createObjectStore("photos", { keyPath: "id" });
        p.createIndex("by-uploaded", "uploaded");
        p.createIndex("by-vehicle", "vehicleId");
        db.createObjectStore("deletions", { keyPath: "path" });
        db.createObjectStore("meta");
      },
    });
  }
  return dbPromise;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await (await getDb()).get("meta", key)) as T | undefined;
}
export async function setMeta(key: string, value: unknown) {
  await (await getDb()).put("meta", value, key);
}

export async function clearAllLocal() {
  const db = await getDb();
  const tx = db.transaction(["vehicles", "photos", "deletions", "meta"], "readwrite");
  await Promise.all([
    tx.objectStore("vehicles").clear(),
    tx.objectStore("photos").clear(),
    tx.objectStore("deletions").clear(),
    tx.objectStore("meta").clear(),
    tx.done,
  ]);
}
