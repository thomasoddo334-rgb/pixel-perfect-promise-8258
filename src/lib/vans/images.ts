// Shrinks a picked photo to max 1600 px on the long side, JPEG.
export const MAX_PHOTO_SIZE = 1600;

export async function resizePhoto(file: Blob, max = MAX_PHOTO_SIZE, quality = 0.85): Promise<Blob> {
  let width: number;
  let height: number;
  let source: CanvasImageSource;
  let cleanup = () => {};
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    width = bitmap.width;
    height = bitmap.height;
    source = bitmap;
    cleanup = () => bitmap.close();
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    width = img.naturalWidth;
    height = img.naturalHeight;
    source = img;
    cleanup = () => URL.revokeObjectURL(url);
  }
  const scale = Math.min(1, max / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(source, 0, 0, w, h);
  cleanup();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Impossible de convertir la photo");
  return blob;
}
