// Stock list filtering and sorting (pure).
import { STATUS_ORDER, computeProgress, type StatusKey, type Vehicle } from "./model";

export type SortKey = "recent" | "least" | "prix_asc" | "prix_desc" | "annee_desc";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Modifiés récemment" },
  { key: "least", label: "Moins avancés d'abord" },
  { key: "prix_asc", label: "Prix croissant" },
  { key: "prix_desc", label: "Prix décroissant" },
  { key: "annee_desc", label: "Année (récente d'abord)" },
];

export type StockFilters = {
  status: StatusKey | "all";
  search: string;
  marque: string;
  disponibilite: string;
  anneeMin: number | null;
  prixMax: number | null;
  sort: SortKey;
};

export const DEFAULT_FILTERS: StockFilters = {
  status: "all",
  search: "",
  marque: "",
  disponibilite: "",
  anneeMin: null,
  prixMax: null,
  sort: "recent",
};

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isPublicVehicle(v: Vehicle): boolean {
  return v.publication === "pret" || v.publication === "publie";
}

export function filterPublicVehicles<T extends Vehicle>(list: T[]): T[] {
  return list.filter(isPublicVehicle);
}

export function countExtraFilters(f: StockFilters): number {
  return [f.marque, f.disponibilite, f.anneeMin, f.prixMax].filter((x) => x !== "" && x !== null).length;
}

export function applyFilters<T extends Vehicle>(list: T[], f: StockFilters, ignoreStatus = false): T[] {
  const q = norm(f.search.trim());
  return list.filter((v) => {
    if (!ignoreStatus && f.status !== "all" && computeProgress(v).status !== f.status) return false;
    if (q && !norm(`${v.marque} ${v.modele} ${v.reference}`).includes(q)) return false;
    if (f.marque && norm(v.marque) !== norm(f.marque)) return false;
    if (f.disponibilite && v.disponibilite !== f.disponibilite) return false;
    if (f.anneeMin !== null && (v.annee === null || v.annee < f.anneeMin)) return false;
    if (f.prixMax !== null && (v.prix === null || v.prix > f.prixMax)) return false;
    return true;
  });
}

export function sortVehicles<T extends Vehicle>(list: T[], sort: SortKey): T[] {
  const arr = [...list];
  const time = (v: Vehicle) => Date.parse(v.updated_at) || 0;
  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return (a - b) * dir;
  };
  switch (sort) {
    case "recent":
      return arr.sort((a, b) => time(b) - time(a));
    case "least":
      return arr.sort((a, b) => {
        const pa = computeProgress(a);
        const pb = computeProgress(b);
        return STATUS_ORDER[pa.status] - STATUS_ORDER[pb.status] || pa.percent - pb.percent || time(b) - time(a);
      });
    case "prix_asc":
      return arr.sort((a, b) => nullsLast(a.prix, b.prix, 1));
    case "prix_desc":
      return arr.sort((a, b) => nullsLast(a.prix, b.prix, -1));
    case "annee_desc":
      return arr.sort((a, b) => nullsLast(a.annee, b.annee, -1));
  }
}
