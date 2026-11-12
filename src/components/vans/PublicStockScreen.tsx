import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Truck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/vans/model";
import { publicVehiclesQuery } from "@/lib/vans/public-queries";
import type { PublicVehicleView } from "@/lib/vans/public.functions";
import { PublicContact } from "./PublicContact";

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function PublicVanCard({ v }: { v: PublicVehicleView }) {
  const title = [v.marque, v.modele].filter((x) => x.trim()).join(" ") || v.reference;
  const cover = v.photos[0];
  const details = [
    v.annee ? String(v.annee) : null,
    v.kilometrage !== null ? `${formatNumber(v.kilometrage)} km` : null,
    v.boite,
    v.couchages ? `${v.couchages} couchage${v.couchages > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  return (
    <Link
      to="/public/van/$id"
      params={{ id: v.id }}
      className="block overflow-hidden rounded-2xl bg-card shadow-card transition-transform active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {cover ? (
          <img src={cover.url} alt={title} className="h-full w-full object-cover" loading="lazy" draggable={false} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Truck className="size-10" strokeWidth={1.25} />
          </div>
        )}
        {v.disponibilite !== "Disponible" && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold">{v.disponibilite}</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[17px] font-bold leading-tight">{title}</p>
          <p className="shrink-0 text-[17px] font-extrabold tabular-nums text-primary">
            {v.prix !== null ? `${formatNumber(v.prix)} $` : ""}
          </p>
        </div>
        <p className="mt-1 text-[13.5px] text-muted-foreground">{details.join(" · ")}</p>
      </div>
    </Link>
  );
}

export function PublicStockScreen() {
  const { data: vans } = useSuspenseQuery(publicVehiclesQuery());
  const [search, setSearch] = useState("");
  const list = useMemo(() => {
    const q = norm(search.trim());
    return q ? vans.filter((v) => norm(`${v.marque} ${v.modele} ${v.reference}`).includes(q)) : vans;
  }, [vans, search]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-14 items-baseline gap-2 pt-3">
            <h1 className="text-[22px] font-extrabold tracking-tight">JCC CAMPERVANS</h1>
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">{vans.length}</span>
          </div>
          <div className="relative pb-3">
            <Search className="pointer-events-none absolute left-3.5 top-3 size-[18px] text-muted-foreground" />
            <Input
              type="search"
              inputMode="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Marque, modèle"
              className="h-11 rounded-xl border-transparent bg-muted pl-10 pr-10 shadow-none"
              aria-label="Rechercher"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1.5 flex size-8 items-center justify-center rounded-full text-muted-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pb-safe mx-auto max-w-3xl px-4 pt-4">
        {list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-muted-foreground">
            <Truck className="mb-3 size-10" strokeWidth={1.25} />
            <p className="font-semibold text-foreground">
              {vans.length === 0 ? "Aucun van disponible pour le moment" : "Aucun van ne correspond"}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((v) => (
              <li key={v.id}>
                <PublicVanCard v={v} />
              </li>
            ))}
          </ul>
        )}

        <section className="mt-10 border-t pb-10 pt-6">
          <h2 className="text-lg font-bold">JCC Campervans NZ</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Une question sur un van ? Contactez-nous.</p>
          <PublicContact />
        </section>
      </main>
    </div>
  );
}
