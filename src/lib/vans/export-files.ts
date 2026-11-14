// Browser-side file generation: downloads, photos ZIP, sharing photos to the iPhone.
import { zipSync, type Zippable } from "fflate";
import { orderedPhotoFiles, type Vehicle } from "./model";
import { getPhotoBlob } from "./photo-cache";

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function todayStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function collectPhotoFiles(v: Vehicle): Promise<{ files: File[]; missing: number }> {
  const files: File[] = [];
  let missing = 0;
  for (const { id, name } of orderedPhotoFiles(v)) {
    const blob = await getPhotoBlob(v.id, id);
    if (!blob) {
      missing++;
      continue;
    }
    files.push(new File([blob], name, { type: "image/jpeg" }));
  }
  return { files, missing };
}

export async function buildPhotosZip(
  vehicles: Vehicle[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ blob: Blob; count: number; missing: number }> {
  const tree: Zippable = {};
  const total = vehicles.reduce((n, v) => n + orderedPhotoFiles(v).length, 0);
  let done = 0;
  let count = 0;
  let missing = 0;
  for (const v of vehicles) {
    const folder: Record<string, [Uint8Array, { level: 0 }]> = {};
    for (const { id, name } of orderedPhotoFiles(v)) {
      const blob = await getPhotoBlob(v.id, id);
      done++;
      onProgress?.(done, total);
      if (!blob) {
        missing++;
        continue;
      }
      folder[name] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }];
      count++;
    }
    if (Object.keys(folder).length) tree[v.reference] = folder;
  }
  const data = zipSync(tree);
  return { blob: new Blob([data as BlobPart], { type: "application/zip" }), count, missing };
}

export async function savePhotosToDevice(files: File[]): Promise<"shared" | "downloaded" | "cancelled"> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (files.length && nav.canShare?.({ files })) {
    try {
      await nav.share({ files });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  for (const f of files) {
    downloadBlob(f.name, f);
    await new Promise((r) => setTimeout(r, 350));
  }
  return "downloaded";
}
