// Public catalogue rules (pure): which vans visitors may see and which fields they get.
import { EQUIPEMENTS, EXTRA_PHOTO_LABEL_EN, PHOTO_SLOTS, normalizePhotos, normalizeVideos, videoStoragePath, type Publication, type Vehicle } from "./model";

export function isPublicVehicle(v: { publication: Publication | string | null; deleted?: boolean }): boolean {
  if (v.deleted) return false;
  return v.publication === "pret" || v.publication === "publie";
}

export function getPublicVehicles<T extends { publication: Publication | string | null; deleted?: boolean }>(list: T[]): T[] {
  return list.filter(isPublicVehicle);
}

// Catalogue order: available vans first, then reserved, then sold; newest first within each group.
const AVAILABILITY_RANK: Record<string, number> = { Disponible: 0, Réservé: 1, Vendu: 2 };
export function availabilityRank(disponibilite: string): number {
  return AVAILABILITY_RANK[disponibilite] ?? 0;
}

export type PublicPhoto = { path: string; label: string };

// Visitor-facing shape. Internal notes (remarque), authorship and sync metadata are never part of it.
export type PublicVehicle = {
  id: string;
  reference: string;
  marque: string;
  modele: string;
  annee: number | null;
  kilometrage: number | null;
  motorisation: string;
  boite: string | null;
  carburant: string | null;
  places: number | null;
  couchages: number | null;
  prix: number | null;
  equipements: string[];
  wof: boolean;
  disponibilite: string;
  publication: "pret" | "publie";
  photos: PublicPhoto[];
  videos: { path: string }[];
};

type PublicSource = Omit<Vehicle, "photos" | "publication" | "videos"> & { photos: unknown; videos?: unknown; publication: string | null };

export function toPublicVehicle(v: Pick<PublicSource, Exclude<keyof PublicVehicle, "videos">> & { videos?: unknown }): PublicVehicle | null {
  if (v.publication !== "pret" && v.publication !== "publie") return null;
  const photos = normalizePhotos(v.photos)
    .map((p, i) => (p.id ? { path: `${v.id}/${p.id}.jpg`, label: PHOTO_SLOTS[i]?.en ?? EXTRA_PHOTO_LABEL_EN } : null))
    .filter((p): p is PublicPhoto => p !== null);
  const known = new Set<string>(EQUIPEMENTS.map((e) => e.key));
  return {
    id: v.id,
    reference: v.reference,
    marque: v.marque,
    modele: v.modele,
    annee: v.annee,
    kilometrage: v.kilometrage,
    motorisation: v.motorisation,
    boite: v.boite,
    carburant: v.carburant,
    places: v.places,
    couchages: v.couchages,
    prix: v.prix,
    equipements: (Array.isArray(v.equipements) ? v.equipements : []).filter((e) => known.has(e)),
    wof: Boolean(v.wof),
    disponibilite: v.disponibilite,
    publication: v.publication,
    photos,
    videos: normalizeVideos(v.videos).map((x) => ({ path: videoStoragePath(v.id, x) })),
  };
}

export function equipmentLabels(keys: string[]): string[] {
  return EQUIPEMENTS.filter((e) => keys.includes(e.key)).map((e) => e.en);
}

// ---- Visitor-facing formatting, sorting and filtering (English, NZ conventions) ----

export function formatNzd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-NZ")}`;
}
export function formatKm(n: number): string {
  return `${Math.round(n).toLocaleString("en-NZ")} km`;
}

export type PublicSort = "newest" | "price_asc" | "price_desc" | "year_desc" | "km_asc";
export const PUBLIC_SORTS: { key: PublicSort; label: string }[] = [
  { key: "newest", label: "Newest listings" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "year_desc", label: "Year: newest first" },
  { key: "km_asc", label: "Mileage: lowest first" },
];

type Sortable = { disponibilite: string; prix: number | null; annee: number | null; kilometrage: number | null };

// Available vans always come first, then reserved, then sold; the chosen sort applies inside each group.
// Vans missing the sorted value go last. "newest" keeps the incoming (most recently updated first) order.
export function sortPublicVehicles<T extends Sortable>(list: T[], sort: PublicSort): T[] {
  const num = (n: number | null, missing: number) => (n === null ? missing : n);
  const by: Record<PublicSort, (a: T, b: T) => number> = {
    newest: () => 0,
    price_asc: (a, b) => num(a.prix, Infinity) - num(b.prix, Infinity),
    price_desc: (a, b) => num(b.prix, -Infinity) - num(a.prix, -Infinity),
    year_desc: (a, b) => num(b.annee, -Infinity) - num(a.annee, -Infinity),
    km_asc: (a, b) => num(a.kilometrage, Infinity) - num(b.kilometrage, Infinity),
  };
  return list
    .map((v, i) => ({ v, i }))
    .sort((x, y) => availabilityRank(x.v.disponibilite) - availabilityRank(y.v.disponibilite) || by[sort](x.v, y.v) || x.i - y.i)
    .map(({ v }) => v);
}

export type PublicFilters = { search: string; boite: string; carburant: string };
export const NO_PUBLIC_FILTERS: PublicFilters = { search: "", boite: "", carburant: "" };

function normText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filterPublicVehicles<T extends { marque: string; modele: string; reference: string; boite: string | null; carburant: string | null }>(
  list: T[],
  f: PublicFilters,
): T[] {
  const q = normText(f.search.trim());
  return list.filter(
    (v) =>
      (!q || normText(`${v.marque} ${v.modele} ${v.reference}`).includes(q)) &&
      (!f.boite || v.boite === f.boite) &&
      (!f.carburant || v.carburant === f.carburant),
  );
}
