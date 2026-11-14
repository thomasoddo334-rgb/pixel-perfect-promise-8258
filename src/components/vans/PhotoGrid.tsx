import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, ImagePlus, Images, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PHOTO_COUNT, PHOTO_SLOTS, extraPhotos, fixedPhotos, type Vehicle } from "@/lib/vans/model";
import { addExtraPhotos, addPhotos, moveExtraPhoto, removeExtraPhoto, removePhoto, setPhoto, setPhotoNotConcerned } from "@/lib/vans/store";
import { PhotoImage } from "./PhotoImage";

export function PhotoGrid({ v }: { v: Vehicle }) {
  const photos = fixedPhotos(v.photos);
  const singleRef = useRef<HTMLInputElement>(null);
  const multiRef = useRef<HTMLInputElement>(null);
  const targetSlot = useRef(0);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [multiBusy, setMultiBusy] = useState(false);
  const emptyCount = photos.filter((p) => !p.id && !p.na).length;

  function pick(slot: number) {
    targetSlot.current = slot;
    singleRef.current?.click();
  }

  async function onSingle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const slot = targetSlot.current;
    setBusy((s) => new Set(s).add(slot));
    try {
      await setPhoto(v.id, slot, file);
    } catch {
      toast.error("Cette photo n'a pas pu être ajoutée.");
    } finally {
      setBusy((s) => {
        const n = new Set(s);
        n.delete(slot);
        return n;
      });
    }
  }

  async function onMulti(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setMultiBusy(true);
    try {
      const { added, skipped } = await addPhotos(v.id, files);
      if (skipped > 0) toast.message(`${added} photo${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}`, { description: `${skipped} ignorée${skipped > 1 ? "s" : ""} : plus d'emplacement libre.` });
      else toast.success(`${added} photo${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}`);
    } catch {
      toast.error("Certaines photos n'ont pas pu être ajoutées.");
    } finally {
      setMultiBusy(false);
    }
  }

  return (
    <div>
      <input ref={singleRef} type="file" accept="image/*" className="hidden" onChange={onSingle} />
      <input ref={multiRef} type="file" accept="image/*" multiple className="hidden" onChange={onMulti} />
      <Button
        variant="soft"
        size="lg"
        className="mb-4 w-full"
        disabled={emptyCount === 0 || multiBusy}
        onClick={() => multiRef.current?.click()}
      >
        {multiBusy ? <Loader2 className="animate-spin" /> : <Images />}
        Ajouter plusieurs photos
        {emptyCount > 0 && <span className="font-medium opacity-70">({emptyCount} libres)</span>}
      </Button>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PHOTO_SLOTS.map((slot, i) => {
          const p = photos[i];
          if (!p) return null;
          const isBusy = busy.has(i);
          return (
            <div key={slot.slug} className="flex flex-col gap-1.5">
              <div
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-xl border",
                  p.id ? "border-transparent" : p.na ? "border-dashed bg-muted/50" : "border-dashed border-input bg-card",
                )}
              >
                {p.id ? (
                  <>
                    <button type="button" className="h-full w-full" onClick={() => pick(i)} aria-label={`Remplacer la photo ${slot.label}`}>
                      <PhotoImage vehicleId={v.id} photoId={p.id} alt={slot.label} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removePhoto(v.id, i)}
                      className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-foreground/70 text-background backdrop-blur"
                      aria-label={`Retirer la photo ${slot.label}`}
                    >
                      <X className="size-4" strokeWidth={2.5} />
                    </button>
                  </>
                ) : p.na ? (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                    <span className="text-sm font-semibold">Pas concerné</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-primary active:bg-accent"
                    aria-label={`Ajouter la photo ${slot.label}`}
                  >
                    {isBusy ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
                  </button>
                )}
                {isBusy && p.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                )}
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[11.5px] font-semibold text-foreground backdrop-blur">
                  {i + 1} · {slot.label}
                </span>
              </div>
              {i > 0 && !p.id && (
                <button
                  type="button"
                  onClick={() => setPhotoNotConcerned(v.id, i, !p.na)}
                  className={cn(
                    "h-9 rounded-lg text-[13px] font-semibold",
                    p.na ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {p.na ? "Annuler « Pas concerné »" : "Pas concerné"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <ExtraPhotos v={v} />
    </div>
  );
}

function ExtraPhotos({ v }: { v: Vehicle }) {
  const extras = extraPhotos(v.photos);
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setProgress(`0/${files.length}`);
    try {
      const { added, failed } = await addExtraPhotos(v.id, files, (d, t) => setProgress(`${d}/${t}`));
      if (failed > 0) toast.error(`${failed} photo${failed > 1 ? "s" : ""} n'${failed > 1 ? "ont" : "a"} pas pu être ajoutée${failed > 1 ? "s" : ""}.`);
      if (added > 0) toast.success(`${added} photo${added > 1 ? "s" : ""} supplémentaire${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}`);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="mt-6 border-t pt-5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-bold">Photos supplémentaires</h3>
        <span className="text-sm font-bold tabular-nums text-muted-foreground">{extras.length}</span>
      </div>
      <p className="mb-3 text-[13px] text-muted-foreground">Facultatives : elles ne comptent pas dans l'avancement.</p>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      <Button variant="soft" size="lg" className="w-full" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
        {progress !== null ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        {progress !== null ? `Ajout en cours… ${progress}` : "Ajouter des photos"}
      </Button>
      {extras.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {extras.map((photoId, i) => {
            const n = PHOTO_COUNT + i + 1;
            return (
              <li key={photoId} className="flex flex-col gap-1.5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <PhotoImage vehicleId={v.id} photoId={photoId} alt={`Photo ${n}`} />
                  <button
                    type="button"
                    onClick={() => void removeExtraPhoto(v.id, photoId)}
                    className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-foreground/70 text-background backdrop-blur"
                    aria-label={`Retirer la photo ${n}`}
                  >
                    <X className="size-4" strokeWidth={2.5} />
                  </button>
                  <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[11.5px] font-semibold text-foreground backdrop-blur">
                    {n}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline"
                    className="h-9"
                    disabled={i === 0}
                    onClick={() => moveExtraPhoto(v.id, photoId, -1)}
                    aria-label={`Monter la photo ${n}`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9"
                    disabled={i === extras.length - 1}
                    onClick={() => moveExtraPhoto(v.id, photoId, 1)}
                    aria-label={`Descendre la photo ${n}`}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
