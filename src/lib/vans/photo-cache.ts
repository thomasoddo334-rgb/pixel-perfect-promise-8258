// Reads a photo from the phone first, then from Lovable Cloud storage (and keeps a local copy).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDb } from "./local-db";
import { photoStoragePath } from "./model";
import { PHOTO_BUCKET } from "./store";

const urlCache = new Map<string, string>();
const inflight = new Map<string, Promise<Blob | null>>();

export function getPhotoBlob(vehicleId: string, photoId: string): Promise<Blob | null> {
  const existing = inflight.get(photoId);
  if (existing) return existing;
  const p = (async () => {
    const db = await getDb();
    const local = await db.get("photos", photoId);
    if (local?.blob) return local.blob;
    if (!navigator.onLine) return null;
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(photoStoragePath(vehicleId, photoId));
    if (error || !data) return null;
    await db.put("photos", { id: photoId, vehicleId, blob: data, uploaded: 1, createdAt: new Date().toISOString() });
    return data;
  })().finally(() => inflight.delete(photoId));
  inflight.set(photoId, p);
  return p;
}

export function usePhotoUrl(vehicleId: string, photoId: string | null): { url: string | null; missing: boolean } {
  const [state, setState] = useState<{ id: string | null; url: string | null; missing: boolean }>(() => ({
    id: photoId,
    url: photoId ? (urlCache.get(photoId) ?? null) : null,
    missing: false,
  }));

  useEffect(() => {
    if (!photoId) {
      setState({ id: null, url: null, missing: false });
      return;
    }
    const cached = urlCache.get(photoId);
    if (cached) {
      setState({ id: photoId, url: cached, missing: false });
      return;
    }
    let cancelled = false;
    setState({ id: photoId, url: null, missing: false });
    void getPhotoBlob(vehicleId, photoId).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        setState({ id: photoId, url: null, missing: true });
        return;
      }
      const url = URL.createObjectURL(blob);
      urlCache.set(photoId, url);
      setState({ id: photoId, url, missing: false });
    });
    const retry = () => {
      if (!urlCache.has(photoId)) setState((s) => ({ ...s, missing: false }));
    };
    window.addEventListener("online", retry);
    return () => {
      cancelled = true;
      window.removeEventListener("online", retry);
    };
  }, [vehicleId, photoId]);

  return state.id === photoId ? { url: state.url, missing: state.missing } : { url: null, missing: false };
}
