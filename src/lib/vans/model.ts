// Pure vehicle model: constants, status rules, helpers. No browser or network access here.

export const MARQUES = [
  "Toyota",
  "Mitsubishi",
  "Nissan",
  "Ford",
  "Mercedes-Benz",
  "Volkswagen",
  "Fiat",
  "Renault",
  "Peugeot",
  "Citroën",
  "Iveco",
  "Hyundai",
  "LDV",
  "Mazda",
  "Opel",
] as const;

export const BOITES = ["Manuelle", "Automatique"] as const;
export const CARBURANTS = ["Diesel", "Pétrole", "Hybride", "Électrique", "GPL"] as const;
export const PLACES = [2, 3, 4, 5, 6, 7, 8, 9] as const;
export const COUCHAGES = [1, 2, 3, 4, 5, 6] as const;
export const DISPONIBILITES = ["Disponible", "Réservé", "Vendu"] as const;
// "chauffage" was removed: older sheets may still store it; it is ignored everywhere, never deleted.
export const EQUIPEMENTS = [
  { key: "cuisine", label: "Cuisine", en: "Kitchen" },
  { key: "batterie", label: "Batterie", en: "Leisure battery" },
  { key: "douche", label: "Douche", en: "Shower" },
  { key: "toilettes", label: "Toilettes", en: "Toilet" },
  { key: "panneaux_solaires", label: "Panneaux solaires", en: "Solar panels" },
] as const;
const EQUIPEMENT_KEYS = new Set<string>(EQUIPEMENTS.map((e) => e.key));
export function knownEquipements(keys: string[]): string[] {
  return keys.filter((k) => EQUIPEMENT_KEYS.has(k));
}
export const REMARQUE_MAX = 400;
export const WOF_LABEL = "wof and rego avalaible for one year";
export const WOF_LABEL_EN = "WOF and rego available for one year";
export const REQUIRED_PHOTO_COUNT = 10;

export const PHOTO_SLOTS = [
  { label: "Avant", slug: "avant" },
  { label: "Arrière", slug: "arriere" },
  { label: "Côté", slug: "cote" },
  { label: "Poste de conduite", slug: "poste-de-conduite" },
  { label: "Salon", slug: "salon" },
  { label: "Cuisine", slug: "cuisine" },
  { label: "Couchage", slug: "couchage" },
  { label: "Salle d'eau", slug: "salle-d-eau" },
  { label: "Rangements", slug: "rangements" },
  { label: "Détail", slug: "detail" },
] as const;
// Fixed, required slots. Optional extra photos follow them in the same stored list (index 10+).
export const PHOTO_COUNT = PHOTO_SLOTS.length;
export const EXTRA_PHOTO_LABEL = "Photo supplémentaire";

export type Disponibilite = (typeof DISPONIBILITES)[number];
export type Publication = "pret" | "publie" | null;
export type PhotoSlot = { id: string | null; na: boolean };

export type Vehicle = {
  id: string;
  reference: string;
  marque: string;
  modele: string;
  plaque: string;
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
  remarque: string;
  publication: Publication;
  photos: PhotoSlot[];
  deleted: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  updated_by_name: string | null;
};

export type StatusKey = "a_renseigner" | "en_cours" | "complete" | "pret" | "publie";

export const STATUSES: { key: StatusKey; label: string }[] = [
  { key: "a_renseigner", label: "À renseigner" },
  { key: "en_cours", label: "En cours" },
  { key: "complete", label: "Complète" },
  { key: "pret", label: "Prêt à publier" },
  { key: "publie", label: "Publié" },
];
export const STATUS_LABEL: Record<StatusKey, string> = Object.fromEntries(
  STATUSES.map((s) => [s.key, s.label]),
) as Record<StatusKey, string>;
export const STATUS_ORDER: Record<StatusKey, number> = {
  a_renseigner: 0,
  en_cours: 1,
  complete: 2,
  pret: 3,
  publie: 4,
};

const REQUIRED_FIELDS: { key: keyof Vehicle; label: string }[] = [
  { key: "marque", label: "Marque" },
  { key: "modele", label: "Modèle" },
  { key: "plaque", label: "Plaque d’immatriculation" },
  { key: "annee", label: "Année" },
  { key: "kilometrage", label: "Kilométrage" },
  { key: "motorisation", label: "Motorisation" },
  { key: "boite", label: "Boîte" },
  { key: "carburant", label: "Carburant" },
  { key: "places", label: "Nombre de places" },
  { key: "couchages", label: "Nombre de couchages" },
  { key: "prix", label: "Prix" },
];

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function emptyPhotos(): PhotoSlot[] {
  return Array.from({ length: PHOTO_COUNT }, () => ({ id: null, na: false }));
}

// The 10 fixed slots, always in order.
export function fixedPhotos(photos: unknown): PhotoSlot[] {
  const list = Array.isArray(photos) ? photos : [];
  return Array.from({ length: PHOTO_COUNT }, (_, i) => {
    const p = list[i] as Partial<PhotoSlot> | null | undefined;
    return { id: p?.id ?? null, na: i === 0 ? false : Boolean(p?.na) };
  });
}

// Optional extra photo ids, in display order. Older sheets' spare slots 11-20 land here, so nothing is lost.
export function extraPhotos(photos: unknown): string[] {
  const list = Array.isArray(photos) ? photos : [];
  return list
    .slice(PHOTO_COUNT)
    .map((p) => (p as Partial<PhotoSlot> | null | undefined)?.id ?? null)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

// Stored shape: 10 fixed slots followed by the extra photos.
export function normalizePhotos(photos: unknown): PhotoSlot[] {
  return [...fixedPhotos(photos), ...extraPhotos(photos).map((id) => ({ id, na: false }))];
}

export function withExtraPhotos(photos: unknown, extras: string[]): PhotoSlot[] {
  return [...fixedPhotos(photos), ...extras.map((id) => ({ id, na: false }))];
}

export type Progress = {
  status: StatusKey;
  percent: number;
  photosDone: number;
  photosWithImage: number;
  missingFields: string[];
  missingPhotos: string[];
  isComplete: boolean;
};

export function computeProgress(v: Vehicle): Progress {
  const photos = fixedPhotos(v.photos);
  const missingFields = REQUIRED_FIELDS.filter((f) => !isFilled(v[f.key])).map((f) => f.label);
  const missingPhotos = photos
    .slice(0, REQUIRED_PHOTO_COUNT)
    .map((p, i) => (p.id || p.na ? null : `${i + 1} ${PHOTO_SLOTS[i]?.label ?? "Photo"}`))
    .filter((x): x is string => x !== null);
  const photosWithImage = photos.filter((p) => p.id).length;
  const photosDone = photos.filter((p) => p.id || p.na).length;
  const requiredPhotosDone = REQUIRED_PHOTO_COUNT - missingPhotos.length;
  const fieldsDone = REQUIRED_FIELDS.length - missingFields.length;
  const total = REQUIRED_FIELDS.length + REQUIRED_PHOTO_COUNT;
  const percent = Math.round(((fieldsDone + requiredPhotosDone) / total) * 100);
  const isComplete = missingFields.length === 0 && missingPhotos.length === 0;

  const anythingEntered =
    fieldsDone > 0 ||
    photosDone > 0 ||
    knownEquipements(v.equipements).length > 0 ||
    v.wof ||
    v.remarque.trim().length > 0;

  let status: StatusKey;
  if (isComplete) {
    status = v.publication === "publie" ? "publie" : v.publication === "pret" ? "pret" : "complete";
  } else {
    status = anythingEntered ? "en_cours" : "a_renseigner";
  }
  return { status, percent, photosDone, photosWithImage, missingFields, missingPhotos, isComplete };
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReference(existing: Iterable<string> = [], random: () => number = Math.random): string {
  const taken = new Set(existing);
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) code += REF_ALPHABET[Math.floor(random() * REF_ALPHABET.length)];
    const ref = `VAN-${code}`;
    if (!taken.has(ref)) return ref;
  }
  return `VAN-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function newVehicle(params: {
  id: string;
  reference: string;
  now: string;
  userId: string | null;
  userName: string | null;
}): Vehicle {
  return {
    id: params.id,
    reference: params.reference,
    marque: "",
    modele: "",
    plaque: "",
    annee: null,
    kilometrage: null,
    motorisation: "",
    boite: null,
    carburant: null,
    places: null,
    couchages: null,
    prix: null,
    equipements: [],
    wof: false,
    disponibilite: "Disponible",
    remarque: "",
    publication: null,
    photos: emptyPhotos(),
    deleted: false,
    created_at: params.now,
    updated_at: params.now,
    updated_by: params.userId,
    updated_by_name: params.userName,
  };
}

export function vehicleTitle(v: Pick<Vehicle, "marque" | "modele" | "annee">): string {
  return [v.marque, v.modele, v.annee ?? ""].filter((x) => String(x).trim()).join(" ").trim();
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function photoFileName(reference: string, slotIndex: number): string {
  const slot = PHOTO_SLOTS[slotIndex];
  if (!slot) throw new RangeError("Unknown photo slot");
  const nn = String(slotIndex + 1).padStart(2, "0");
  return `${reference}_${nn}_${slot.slug}.jpg`;
}

// Extra photos continue the numbering after the fixed slots: REF_11.jpg, REF_12.jpg…
export function extraPhotoFileName(reference: string, extraIndex: number): string {
  return `${reference}_${PHOTO_COUNT + extraIndex + 1}.jpg`;
}

// Every photo of a sheet in export order (fixed slots, then extras) with its file name.
export function orderedPhotoFiles(v: Pick<Vehicle, "reference" | "photos">): { id: string; name: string }[] {
  const fixed = fixedPhotos(v.photos).flatMap((p, i) => (p.id ? [{ id: p.id, name: photoFileName(v.reference, i) }] : []));
  const extras = extraPhotos(v.photos).map((id, i) => ({ id, name: extraPhotoFileName(v.reference, i) }));
  return [...fixed, ...extras];
}

export function photoStoragePath(vehicleId: string, photoId: string): string {
  return `${vehicleId}/${photoId}.jpg`;
}

