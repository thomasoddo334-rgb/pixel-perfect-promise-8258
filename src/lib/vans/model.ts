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
export const EQUIPEMENTS = [
  { key: "cuisine", label: "Cuisine" },
  { key: "batterie", label: "Batterie" },
  { key: "chauffage", label: "Chauffage" },
  { key: "douche", label: "Douche" },
  { key: "toilettes", label: "Toilettes" },
  { key: "panneaux_solaires", label: "Panneaux solaires" },
] as const;
export const REMARQUE_MAX = 400;

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
export const PHOTO_COUNT = PHOTO_SLOTS.length;

export type Disponibilite = (typeof DISPONIBILITES)[number];
export type Publication = "pret" | "publie" | null;
export type PhotoSlot = { id: string | null; na: boolean };

export type Vehicle = {
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

export function normalizePhotos(photos: unknown): PhotoSlot[] {
  const list = Array.isArray(photos) ? photos : [];
  return Array.from({ length: PHOTO_COUNT }, (_, i) => {
    const p = list[i] as Partial<PhotoSlot> | null | undefined;
    return { id: p?.id ?? null, na: i === 0 ? false : Boolean(p?.na) };
  });
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
  const photos = normalizePhotos(v.photos);
  const missingFields = REQUIRED_FIELDS.filter((f) => !isFilled(v[f.key])).map((f) => f.label);
  const missingPhotos = photos
    .map((p, i) => (p.id || p.na ? null : `${i + 1} ${PHOTO_SLOTS[i].label}`))
    .filter((x): x is string => x !== null);
  const photosWithImage = photos.filter((p) => p.id).length;
  const photosDone = PHOTO_COUNT - missingPhotos.length;
  const fieldsDone = REQUIRED_FIELDS.length - missingFields.length;
  const total = REQUIRED_FIELDS.length + PHOTO_COUNT;
  const percent = Math.round(((fieldsDone + photosDone) / total) * 100);
  const isComplete = missingFields.length === 0 && missingPhotos.length === 0;

  const anythingEntered =
    fieldsDone > 0 ||
    photosDone > 0 ||
    v.equipements.length > 0 ||
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
  const nn = String(slotIndex + 1).padStart(2, "0");
  return `${reference}_${nn}_${PHOTO_SLOTS[slotIndex].slug}.jpg`;
}

export function photoStoragePath(vehicleId: string, photoId: string): string {
  return `${vehicleId}/${photoId}.jpg`;
}
