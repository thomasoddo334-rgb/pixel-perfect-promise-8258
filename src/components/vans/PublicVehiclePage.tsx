import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Expand, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WOF_LABEL, formatNumber } from "@/lib/vans/model";
import { equipmentLabels } from "@/lib/vans/public";
import { publicVehicleQuery } from "@/lib/vans/public-queries";
import { PublicContact } from "./PublicContact";

export function PublicVehiclePage({ id }: { id: string }) {
  const { data: v } = useSuspenseQuery(publicVehicleQuery(id));
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const title = [v.marque, v.modele].filter((x) => x.trim()).join(" ") || v.reference;
  const specs: [string, string | null][] = [
    ["Année", v.annee ? String(v.annee) : null],
    ["Kilométrage", v.kilometrage !== null ? `${formatNumber(v.kilometrage)} km` : null],
    ["Motorisation", v.motorisation || null],
    ["Boîte", v.boite],
    ["Carburant", v.carburant],
    ["Places", v.places ? String(v.places) : null],
    ["Couchages", v.couchages ? String(v.couchages) : null],
    ["Disponibilité", v.disponibilite],
  ];
  const equipment = equipmentLabels(v.equipements);

  useEffect(() => {
    if (selectedPhotoIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedPhotoIndex(null);
      if (event.key === "ArrowRight") setSelectedPhotoIndex((index) => (index === null ? null : (index + 1) % v.photos.length));
      if (event.key === "ArrowLeft") setSelectedPhotoIndex((index) => (index === null ? null : (index - 1 + v.photos.length) % v.photos.length));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPhotoIndex, v.photos.length]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
          <Button asChild variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Retour aux vans">
            <Link to="/public">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <p className="truncate text-[17px] font-bold">{title}</p>
        </div>
      </header>

      <main className="pb-safe mx-auto max-w-3xl pb-10">
        {v.photos.length > 0 ? (
          <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pt-4">
            {v.photos.map((p, i) => (
              <button
                key={p.url}
                type="button"
                onClick={() => setSelectedPhotoIndex(i)}
                aria-label={`Afficher en grand la photo ${i + 1} : ${p.label}`}
                className="group relative aspect-[4/3] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl bg-muted text-left md:w-[70%]"
              >
                <img
                  src={p.url}
                  alt={`${title} – ${p.label}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  <Expand className="size-3.5" /> Agrandir
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mx-4 mt-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Truck className="size-12" strokeWidth={1.25} />
          </div>
        )}

        <div className="px-4">
          <div className="mt-5 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Réf. {v.reference}</p>
            </div>
            {v.prix !== null && (
              <p className="shrink-0 text-2xl font-extrabold tabular-nums text-primary">{formatNumber(v.prix)} $</p>
            )}
          </div>

          {v.wof && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-sm font-semibold text-primary">
              <Check className="size-4" /> {WOF_LABEL}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border">
            {specs
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="bg-card px-4 py-3">
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-semibold">{value}</dd>
                </div>
              ))}
          </dl>

          {equipment.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold">Équipements</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {equipment.map((e) => (
                  <li key={e} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
                    <Check className="size-3.5 text-primary" /> {e}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8 border-t pt-6">
            <h2 className="text-lg font-bold">Intéressé par ce van ?</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">JCC Campervans NZ vous répond rapidement.</p>
            <PublicContact subject={`${title} (${v.reference})`} />
          </section>
        </div>
      </main>

      {selectedPhotoIndex !== null && v.photos[selectedPhotoIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${selectedPhotoIndex + 1} sur ${v.photos.length} : ${title}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 text-white backdrop-blur-sm"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(null)}
            aria-label="Fermer la photo"
            className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <X className="size-6" />
          </button>
          {v.photos.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedPhotoIndex((selectedPhotoIndex - 1 + v.photos.length) % v.photos.length);
              }}
              aria-label="Photo précédente"
              className="absolute left-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:left-6"
            >
              <ChevronLeft className="size-7" />
            </button>
          )}
          <figure className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
            <img
              src={v.photos[selectedPhotoIndex].url}
              alt={`${title} – ${v.photos[selectedPhotoIndex].label}`}
              className="max-h-[82dvh] max-w-[88vw] rounded-lg object-contain"
            />
            <figcaption className="text-center text-sm text-white/80">
              {v.photos[selectedPhotoIndex].label} · {selectedPhotoIndex + 1} / {v.photos.length}
            </figcaption>
          </figure>
          {v.photos.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedPhotoIndex((selectedPhotoIndex + 1) % v.photos.length);
              }}
              aria-label="Photo suivante"
              className="absolute right-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:right-6"
            >
              <ChevronRight className="size-7" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
