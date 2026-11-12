import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoImage } from "@/components/vans/PhotoImage";
import { StatusPill } from "@/components/vans/StatusPill";
import { cn } from "@/lib/utils";
import { filterPublicVehicles, sortVehicles } from "@/lib/vans/filters";
import { formatNumber, normalizePhotos, type Vehicle } from "@/lib/vans/model";
import { useVans } from "@/lib/vans/store";

function PublicVanCard({ v }: { v: Vehicle }) {
  const first = normalizePhotos(v.photos)[0];
  const title = [v.marque, v.modele].filter(Boolean).join(" ") || "Nouveau véhicule";
  const details = [v.annee ? String(v.annee) : null, v.kilometrage !== null ? `${formatNumber(v.kilometrage)} km` : null].filter(Boolean);

  return (
    <Link to="/public/$id" params={{ id: v.id }} className="flex gap-3 rounded-2xl bg-card p-3 shadow-card transition-transform active:scale-[0.99]">
      <div className="relative h-[84px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-muted">
        {first?.id ? (
          <PhotoImage vehicleId={v.id} photoId={first.id} alt={title} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Truck className="size-7" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[16px] font-bold leading-tight">{title}</p>
          <p className="shrink-0 text-[15px] font-bold tabular-nums text-primary">
            {v.prix !== null ? `${formatNumber(v.prix)} $` : ""}
          </p>
        </div>

        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {[v.reference, ...details].join(" · ")}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-1.5">
          <StatusPill status={v.publication === "publie" ? "publie" : v.publication === "pret" ? "pret" : "complete"} />
          {v.disponibilite !== "Disponible" && (
            <span className="text-xs font-semibold text-muted-foreground">· {v.disponibilite}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function PublicStockScreen() {
  const { vehicles, loaded } = useVans();
  const publicVehicles = useMemo(() => sortVehicles(filterPublicVehicles(vehicles), "recent"), [vehicles]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-14 items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Catalogue</p>
              <h1 className="text-[22px] font-extrabold tracking-tight">Vans disponibles</h1>
            </div>
            <Button asChild variant="ghost" className="h-10 rounded-full px-3">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Admin
              </Link>
            </Button>
          </div>

          <div className="relative pb-3">
            <Search className="pointer-events-none absolute left-3.5 top-3 size-[18px] text-muted-foreground" />
            <Input
              type="search"
              readOnly
              value=""
              placeholder="Catalogue public"
              className={cn("h-11 rounded-xl border-transparent bg-muted pl-10 shadow-none opacity-80")}
              aria-label="Catalogue public"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-36 pt-3">
        {!loaded ? null : publicVehicles.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-muted-foreground">
            <Truck className="mb-3 size-10" strokeWidth={1.25} />
            <p className="font-semibold text-foreground">Aucun véhicule public pour le moment</p>
            <p className="mt-1 text-sm">Les vans seront ajoutés ici dès qu’ils seront prêts à publier.</p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {publicVehicles.map((v) => (
              <li key={v.id}>
                <PublicVanCard v={v} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
