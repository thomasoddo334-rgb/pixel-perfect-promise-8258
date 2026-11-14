// Pure export builders (CSV for Wix, social post text). File I/O lives in export-files.ts.
import { buildContactDetails } from "../contact";
import {
  EQUIPEMENTS,
  PHOTO_COUNT,
  STATUS_LABEL,
  WOF_LABEL_EN,
  computeProgress,
  extraPhotoFileName,
  extraPhotos,
  fixedPhotos,
  photoFileName,
  vehicleTitle,
  type Vehicle,
} from "./model";

export const CSV_COLUMNS = [
  "reference",
  "titre",
  "marque",
  "modele",
  "plaque",
  "annee",
  "kilometrage",
  "motorisation",
  "boite",
  "carburant",
  "places",
  "couchages",
  "equipements",
  ...EQUIPEMENTS.map((e) => e.key),
  "wof",
  "prix",
  "disponibilite",
  "remarque",
  "statut",
  "photo_principale",
  ...Array.from({ length: PHOTO_COUNT }, (_, i) => `photo_${i + 1}`),
  "photos_supplementaires",
];

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// One entry per fixed slot (empty when no photo).
export function photoFileNames(v: Vehicle): string[] {
  return fixedPhotos(v.photos).map((p, i) => (p.id ? photoFileName(v.reference, i) : ""));
}

export function extraPhotoFileNames(v: Vehicle): string[] {
  return extraPhotos(v.photos).map((_, i) => extraPhotoFileName(v.reference, i));
}

export function vehicleCsvRow(v: Vehicle): string[] {
  const files = photoFileNames(v);
  const eq = new Set(v.equipements);
  const status = computeProgress(v).status;
  return [
    v.reference,
    vehicleTitle(v),
    v.marque,
    v.modele,
    v.plaque,
    v.annee?.toString() ?? "",
    v.kilometrage?.toString() ?? "",
    v.motorisation,
    v.boite ?? "",
    v.carburant ?? "",
    v.places?.toString() ?? "",
    v.couchages?.toString() ?? "",
    EQUIPEMENTS.filter((e) => eq.has(e.key))
      .map((e) => e.label)
      .join(", "),
    ...EQUIPEMENTS.map((e) => (eq.has(e.key) ? "Oui" : "Non")),
    v.wof ? "Oui" : "Non",
    v.prix?.toString() ?? "",
    v.disponibilite,
    v.remarque,
    STATUS_LABEL[status],
    files.find((f) => f) ?? "",
    ...files,
    extraPhotoFileNames(v).join(" | "),
  ];
}

export function buildWixCsv(vehicles: Vehicle[]): string {
  const lines = [CSV_COLUMNS, ...vehicles.map(vehicleCsvRow)].map((row) => row.map(csvCell).join(","));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

function hashtag(s: string): string {
  return (
    "#" +
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
  );
}

const GEARBOX_EN: Record<string, string> = { Manuelle: "Manual", Automatique: "Automatic" };
const FUEL_EN: Record<string, string> = {
  Diesel: "Diesel",
  Pétrole: "Petrol",
  Hybride: "Hybrid",
  Électrique: "Electric",
  GPL: "LPG",
};

function formatNumberEn(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Facebook / Instagram text, entirely in English (the app UI itself stays French).
export function buildSocialPost(v: Vehicle): string {
  const eq = new Set(v.equipements);
  const equipment = EQUIPEMENTS.filter((e) => eq.has(e.key)).map((e) => e.en);
  const lines: string[] = [];
  lines.push(`🚐 ${[v.marque, v.modele].filter(Boolean).join(" ") || "Campervan"} for sale${v.annee ? ` – ${v.annee}` : ""}`);
  lines.push("");
  if (v.annee) lines.push(`📅 Year: ${v.annee}`);
  if (v.kilometrage !== null) lines.push(`🛣️ Mileage: ${formatNumberEn(v.kilometrage)} km`);
  const gearbox = v.boite ? (GEARBOX_EN[v.boite] ?? v.boite) : "";
  const fuel = v.carburant ? (FUEL_EN[v.carburant] ?? v.carburant) : "";
  const meca = [v.motorisation, gearbox, fuel].filter(Boolean).join(" · ");
  if (meca) lines.push(`⚙️ Engine: ${meca}`);
  const cap = [
    v.places ? `${v.places} seat${v.places > 1 ? "s" : ""}` : "",
    v.couchages ? `sleeps ${v.couchages}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (cap) lines.push(`👥 ${cap}`);
  if (equipment.length) lines.push(`✅ Equipment: ${equipment.join(", ")}`);
  if (v.wof) lines.push(`🔧 ${WOF_LABEL_EN}`);
  if (v.prix !== null) lines.push(`💰 Price: $${formatNumberEn(v.prix)} NZD`);
  if (v.remarque.trim()) {
    lines.push("");
    lines.push(v.remarque.trim());
  }
  lines.push("");
  lines.push(...buildContactDetails());
  lines.push("");
  const tags = ["#vanlife", "#campervan", "#newzealand", "#nzvanlife", "#campervanforsale", "#vanforsale", "#roadtripnz"];
  if (v.marque) tags.push(hashtag(v.marque));
  if (v.modele) tags.push(hashtag(v.modele));
  lines.push(tags.join(" "));
  return lines.join("\n");
}

