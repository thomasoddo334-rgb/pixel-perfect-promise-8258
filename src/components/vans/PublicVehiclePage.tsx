import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Expand, Share2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AVAILABILITY_EN, FUEL_EN, GEARBOX_EN, WOF_LABEL } from "@/lib/vans/model";
import { equipmentLabels, formatKm, formatNzd } from "@/lib/vans/public";
import { publicVehicleQuery } from "@/lib/vans/public-queries";
import { BrandFooter } from "./PublicBrand";
import { ContactBar } from "./PublicContact";

export function PublicVehiclePage({ id }: { id: string }) {
  const { data: v } = useSuspenseQuery(publicVehicleQuery(id));
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const title = [v.marque, v.modele].filter((x) => x.trim()).join(" ") || v.reference;
  const specs: [string, string | null][] = [
    ["Year", v.annee ? String(v.annee) : null],
    ["Mileage", v.kilometrage !== null ? formatKm(v.kilometrage) : null],
    ["Engine", v.motorisation || null],
    ["Transmission", v.boite ? (GEARBOX_EN[v.boite] ?? v.boite) : null],
    ["Fuel", v.carburant ? (FUEL_EN[v.carburant] ?? v.carburant) : null],
    ["Seats", v.places ? String(v.places) : null],
    ["Sleeps", v.couchages ? String(v.couchages) : null],
    ["Availability", AVAILABILITY_EN[v.disponibilite] ?? v.disponibilite],
  ];
  const equipment = equipmentLabels(v.equipements);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled by the visitor */
    }
  }

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
    <div className="brand-public min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 bg-brand text-brand-foreground">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-10 rounded-full text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
            aria-label="Back to all vans"
          >
            <Link to="/public">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <p className="min-w-0 flex-1 truncate text-[17px] font-bold">{title}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void share()}
            className="size-10 rounded-full text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
            aria-label="Share this van"
          >
            <Share2 className="size-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl pb-32">
        {v.photos.length > 0 ? (
          <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pt-4">
            {v.photos.map((p, i) => (
              <button
                key={p.url}
                type="button"
                onClick={() => setSelectedPhotoIndex(i)}
                aria-label={`View photo ${i + 1} full size: ${p.label}`}
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
                  <Expand className="size-3.5" /> Enlarge
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
              <p className="mt-1 text-sm text-muted-foreground">Ref. {v.reference}</p>
            </div>
            {v.prix !== null && (
              <p className="shrink-0 rounded-full bg-brand-accent px-3.5 py-1 text-xl font-extrabold tabular-nums text-brand-accent-foreground">
                {formatNzd(v.prix)}
              </p>
            )}
          </div>

          {v.wof && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-accent px-3.5 py-1.5 text-sm font-semibold text-brand-accent-foreground">
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
              <h2 className="text-lg font-bold">Equipment</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {equipment.map((e) => (
                  <li key={e} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
                    <Check className="size-3.5 text-brand-ink" /> {e}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <BrandFooter teamLink />
        </div>
      </main>

      <ContactBar subject={`${title} (${v.reference})`} />

      {selectedPhotoIndex !== null && v.photos[selectedPhotoIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${selectedPhotoIndex + 1} of ${v.photos.length}: ${title}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 text-white backdrop-blur-sm"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(null)}
            aria-label="Close photo"
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
              aria-label="Previous photo"
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
              aria-label="Next photo"
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
