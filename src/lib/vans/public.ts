// Public catalogue rules (pure): which vans visitors may see and which fields they get.
import { EQUIPEMENTS, PHOTO_SLOTS, normalizePhotos, type Publication, type Vehicle } from "./model";

export function isPublicVehicle(v: { publication: Publication | string | null; deleted?: boolean }): boolean {
  if (v.deleted) return false;
  return v.publication === "pret" || v.publication === "publie";
}

export function getPublicVehicles<T extends { publication: Publication | string | null; deleted?: boolean }>(list: T[]): T[] {
  return list.filter(isPublicVehicle);
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
};

type PublicSource = Omit<Vehicle, "photos" | "publication"> & { photos: unknown; publication: string | null };

export function toPublicVehicle(v: Pick<PublicSource, keyof PublicVehicle>): PublicVehicle | null {
  if (v.publication !== "pret" && v.publication !== "publie") return null;
  const photos = normalizePhotos(v.photos)
    .map((p, i) => (p.id ? { path: `${v.id}/${p.id}.jpg`, label: PHOTO_SLOTS[i]?.label ?? "Photo" } : null))
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
  };
}

export function equipmentLabels(keys: string[]): string[] {
  return EQUIPEMENTS.filter((e) => keys.includes(e.key)).map((e) => e.label);
}
