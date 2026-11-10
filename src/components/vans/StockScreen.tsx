import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Download, LogOut, MoreHorizontal, Plus, Search, SlidersHorizontal, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { createVehicle, useVans } from "@/lib/vans/store";
import { DISPONIBILITES, STATUSES, computeProgress, type StatusKey } from "@/lib/vans/model";
import {
  DEFAULT_FILTERS,
  SORTS,
  applyFilters,
  countExtraFilters,
  sortVehicles,
  type SortKey,
  type StockFilters,
} from "@/lib/vans/filters";
import { SyncIndicator } from "./SyncIndicator";
import { StatusDot } from "./StatusPill";
import { VanCard } from "./VanCard";
import { Segmented } from "./Segmented";

// Kept outside React so filters survive going to a sheet and back.
let savedFilters: StockFilters = DEFAULT_FILTERS;

function digits(value: string): number | null {
  const d = value.replace(/\D/g, "");
  return d ? Number(d) : null;
}

export function StockScreen() {
  const { vehicles, loaded } = useVans();
  const auth = useAuth();
  const navigate = useNavigate();
  const [filters, setFiltersState] = useState<StockFilters>(savedFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const setFilters = (patch: Partial<StockFilters>) =>
    setFiltersState((f) => {
      const next = { ...f, ...patch };
      savedFilters = next;
      return next;
    });

  const base = useMemo(() => applyFilters(vehicles, filters, true), [vehicles, filters]);
  const counts = useMemo(() => {
    const c: Record<StatusKey | "all", number> = { all: base.length, a_renseigner: 0, en_cours: 0, complete: 0, pret: 0, publie: 0 };
    for (const v of base) c[computeProgress(v).status]++;
    return c;
  }, [base]);
  const list = useMemo(
    () => sortVehicles(filters.status === "all" ? base : base.filter((v) => computeProgress(v).status === filters.status), filters.sort),
    [base, filters.status, filters.sort],
  );
  const marques = useMemo(
    () => [...new Set(vehicles.map((v) => v.marque.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
    [vehicles],
  );
  const extra = countExtraFilters(filters);

  function addVehicle() {
    const id = createVehicle();
    void navigate({ to: "/van/$id", params: { id } });
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-14 items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <h1 className="text-[22px] font-extrabold tracking-tight">Stock</h1>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{vehicles.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <SyncIndicator />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Menu">
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{auth.email}</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="h-11 text-[15px]">
                    <Link to="/exports">
                      <Download className="size-4" /> Exporter
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="h-11 text-[15px]" onSelect={() => void auth.signOut()}>
                    <LogOut className="size-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative pb-3">
            <Search className="pointer-events-none absolute left-3.5 top-3 size-[18px] text-muted-foreground" />
            <Input
              type="search"
              inputMode="search"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Marque, modèle, référence"
              className="h-11 rounded-xl border-transparent bg-muted pl-10 pr-10 shadow-none"
              aria-label="Rechercher"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters({ search: "" })}
                className="absolute right-2 top-1.5 flex size-8 items-center justify-center rounded-full text-muted-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="no-scrollbar mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pb-3">
          {[{ key: "all" as const, label: "Tous" }, ...STATUSES].map((s) => {
            const active = filters.status === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilters({ status: s.key })}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors",
                  active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
                )}
              >
                {s.key !== "all" && <StatusDot status={s.key} />}
                {s.label}
                <span className={cn("tabular-nums", active ? "opacity-70" : "text-muted-foreground")}>{counts[s.key]}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-36 pt-3">
        <div className="mb-3 flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-full px-4" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal />
            Filtres
            {extra > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {extra}
              </span>
            )}
          </Button>
          <label className="relative ml-auto">
            <span className="sr-only">Trier</span>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ sort: e.target.value as SortKey })}
              className="h-10 appearance-none rounded-full border border-input bg-card pl-4 pr-9 text-sm font-medium"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
          </label>
        </div>

        {!loaded ? null : list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-muted-foreground">
            <Truck className="mb-3 size-10" strokeWidth={1.25} />
            {vehicles.length === 0 ? (
              <>
                <p className="font-semibold text-foreground">Aucun véhicule pour l'instant</p>
                <p className="mt-1 text-sm">Ajoutez votre premier van avec le bouton ci-dessous.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">Aucun véhicule ne correspond</p>
                <Button variant="link" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>
                  Effacer les filtres
                </Button>
              </>
            )}
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((v) => (
              <li key={v.id}>
                <VanCard v={v} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pt-8">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <Button variant="float" size="xl" className="w-full" onClick={addVehicle}>
            <Plus strokeWidth={2.5} />
            Ajouter un véhicule
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="pb-safe max-h-[88dvh] overflow-y-auto rounded-t-3xl px-5">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Filtres</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="f-marque">Marque</Label>
              <select
                id="f-marque"
                value={filters.marque}
                onChange={(e) => setFilters({ marque: e.target.value })}
                className="h-12 rounded-xl border border-input bg-card px-3"
              >
                <option value="">Toutes les marques</option>
                {marques.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Disponibilité</Label>
              <Segmented
                ariaLabel="Disponibilité"
                options={[{ value: "", label: "Toutes" }, ...DISPONIBILITES.map((d) => ({ value: d, label: d }))]}
                value={filters.disponibilite}
                onChange={(v) => setFilters({ disponibilite: v ?? "" })}
                allowDeselect={false}
                columns={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="f-annee">Année minimum</Label>
                <Input
                  id="f-annee"
                  inputMode="numeric"
                  placeholder="ex. 2010"
                  value={filters.anneeMin ?? ""}
                  onChange={(e) => setFilters({ anneeMin: digits(e.target.value) })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="f-prix">Prix maximum ($)</Label>
                <Input
                  id="f-prix"
                  inputMode="numeric"
                  placeholder="ex. 30000"
                  value={filters.prixMax ?? ""}
                  onChange={(e) => setFilters({ prixMax: digits(e.target.value) })}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setFilters({ marque: "", disponibilite: "", anneeMin: null, prixMax: null })}
              >
                Réinitialiser
              </Button>
              <Button size="lg" onClick={() => setSheetOpen(false)}>
                Voir {list.length} van{list.length > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
