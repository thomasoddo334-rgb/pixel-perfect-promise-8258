import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Truck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AVAILABILITY_EN, FUEL_EN, GEARBOX_EN } from "@/lib/vans/model";
import {
  NO_PUBLIC_FILTERS,
  PUBLIC_SORTS,
  filterPublicVehicles,
  formatKm,
  formatNzd,
  sortPublicVehicles,
  type PublicFilters,
  type PublicSort,
} from "@/lib/vans/public";
import { publicVehiclesQuery } from "@/lib/vans/public-queries";
import type { PublicVehicleView } from "@/lib/vans/public.functions";
import { cn } from "@/lib/utils";
import { BrandFooter, BrandLogo } from "./PublicBrand";
import { PublicContact } from "./PublicContact";

const SELECT_CLASS = "h-10 min-w-0 flex-1 rounded-xl border border-transparent bg-muted px-3 text-sm font-medium text-foreground";

function PublicVanCard({ v }: { v: PublicVehicleView }) {
  const title = [v.marque, v.modele].filter((x) => x.trim()).join(" ") || v.reference;
  const cover = v.photos[0];
  const unavailable = v.disponibilite !== "Disponible";
  const details = [
    v.annee ? String(v.annee) : null,
    v.kilometrage !== null ? formatKm(v.kilometrage) : null,
    v.boite ? (GEARBOX_EN[v.boite] ?? v.boite) : null,
    v.couchages ? `Sleeps ${v.couchages}` : null,
  ].filter(Boolean);
  return (
    <Link
      to="/public/van/$id"
      params={{ id: v.id }}
      className="block overflow-hidden rounded-2xl bg-card shadow-card transition-transform active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {cover ? (
          <img
            src={cover.url}
            alt={title}
            className={cn("h-full w-full object-cover", v.disponibilite === "Vendu" && "opacity-70 grayscale")}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Truck className="size-10" strokeWidth={1.25} />
          </div>
        )}
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-accent px-3 py-1 text-xs font-bold text-brand-accent-foreground">
            {AVAILABILITY_EN[v.disponibilite] ?? v.disponibilite}
          </span>
        )}
      </div>
      <div className={cn("p-4", v.disponibilite === "Vendu" && "opacity-70")}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[17px] font-bold leading-tight">{title}</p>
          {v.prix !== null && (
            <p className="shrink-0 rounded-full bg-brand-accent px-3 py-1 text-[15px] font-extrabold tabular-nums text-brand-accent-foreground">
              {formatNzd(v.prix)}
            </p>
          )}
        </div>
        <p className="mt-1 text-[13.5px] text-muted-foreground">{details.join(" · ")}</p>
      </div>
    </Link>
  );
}

export function PublicStockScreen() {
  const { data: vans } = useSuspenseQuery(publicVehiclesQuery());
  const [filters, setFilters] = useState<PublicFilters>(NO_PUBLIC_FILTERS);
  const [sort, setSort] = useState<PublicSort>("newest");

  const fuels = useMemo(() => [...new Set(vans.map((v) => v.carburant).filter((x): x is string => Boolean(x)))], [vans]);
  const list = useMemo(() => sortPublicVehicles(filterPublicVehicles(vans, filters), sort), [vans, filters, sort]);
  const filtered = filters.search !== "" || filters.boite !== "" || filters.carburant !== "";

  return (
    <div className="brand-public min-h-dvh bg-background">
      <header className="pt-safe rounded-b-[28px] bg-brand text-brand-foreground">
        <div className="mx-auto max-w-3xl px-4 pb-6 pt-5 md:pt-7">
          <BrandLogo eager className="mx-auto h-40 w-40 md:h-56 md:w-56" />
          <div className="mt-2 flex items-center justify-center gap-2">
            <h1 className="text-[22px] font-extrabold tracking-tight text-brand-foreground md:text-[26px]">Campervans for sale</h1>
            <span className="rounded-full bg-brand-accent px-2.5 py-0.5 text-sm font-bold tabular-nums text-brand-accent-foreground">{vans.length}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-2 px-4 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3 size-[18px] text-muted-foreground" />
          <Input
            type="search"
            inputMode="search"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search make or model"
            className="h-11 rounded-xl border-transparent bg-muted pl-10 pr-10 shadow-none"
            aria-label="Search"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-2 top-1.5 flex size-8 items-center justify-center rounded-full text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as PublicSort)} className={SELECT_CLASS}>
            {PUBLIC_SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select aria-label="Transmission" value={filters.boite} onChange={(e) => setFilters({ ...filters, boite: e.target.value })} className={SELECT_CLASS}>
            <option value="">Any transmission</option>
            {Object.entries(GEARBOX_EN).map(([fr, en]) => (
              <option key={fr} value={fr}>
                {en}
              </option>
            ))}
          </select>
          <select aria-label="Fuel" value={filters.carburant} onChange={(e) => setFilters({ ...filters, carburant: e.target.value })} className={SELECT_CLASS}>
            <option value="">Any fuel</option>
            {fuels.map((f) => (
              <option key={f} value={f}>
                {FUEL_EN[f] ?? f}
              </option>
            ))}
          </select>
        </div>
        {filtered && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {list.length} of {vans.length} vans
            </span>
            <button type="button" onClick={() => setFilters(NO_PUBLIC_FILTERS)} className="font-semibold text-brand-ink underline-offset-2 hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      <main className="pb-safe mx-auto max-w-3xl px-4 pt-4">
        {list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-muted-foreground">
            <Truck className="mb-3 size-10" strokeWidth={1.25} />
            <p className="font-semibold text-foreground">{vans.length === 0 ? "No vans available right now" : "No vans match your search"}</p>
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
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Questions about a van? Get in touch.</p>
          <PublicContact />
          <BrandFooter teamLink />
        </section>
      </main>
    </div>
  );
}
