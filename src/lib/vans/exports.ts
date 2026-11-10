// Pure export builders (CSV for Wix, social post text). File I/O lives in export-files.ts.
import {
  EQUIPEMENTS,
  PHOTO_COUNT,
  STATUS_LABEL,
  computeProgress,
  formatNumber,
  normalizePhotos,
  photoFileName,
  vehicleTitle,
  type Vehicle,
} from "./model";

export const CSV_COLUMNS = [
  "reference",
  "titre",
  "marque",
  "modele",
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
];

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function photoFileNames(v: Vehicle): string[] {
  return normalizePhotos(v.photos).map((p, i) => (p.id ? photoFileName(v.reference, i) : ""));
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

export function buildSocialPost(v: Vehicle): string {
  const eq = new Set(v.equipements);
  const equipements = EQUIPEMENTS.filter((e) => eq.has(e.key)).map((e) => e.label);
  const lines: string[] = [];
  lines.push(`🚐 ${[v.marque, v.modele].filter(Boolean).join(" ") || "Van aménagé"}${v.annee ? ` – ${v.annee}` : ""}`);
  lines.push("");
  if (v.annee) lines.push(`📅 Année : ${v.annee}`);
  if (v.kilometrage !== null) lines.push(`🛣️ Kilométrage : ${formatNumber(v.kilometrage)} km`);
  const meca = [v.motorisation, v.boite, v.carburant].filter(Boolean).join(" · ");
  if (meca) lines.push(`⚙️ ${meca}`);
  const cap = [
    v.places ? `${v.places} places` : "",
    v.couchages ? `${v.couchages} couchage${v.couchages > 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (cap) lines.push(`👥 ${cap}`);
  if (equipements.length) lines.push(`✅ Équipements : ${equipements.join(", ")}`);
  if (v.wof) lines.push("🔧 WOF en cours de validité");
  if (v.prix !== null) lines.push(`💰 Prix : ${formatNumber(v.prix)} $ NZD`);
  if (v.remarque.trim()) {
    lines.push("");
    lines.push(v.remarque.trim());
  }
  lines.push("");
  const tags = ["#vanlife", "#campervan", "#vanamenage", "#nouvellezelande", "#newzealand", "#vanforsale", "#selfcontained"];
  if (v.marque) tags.push(hashtag(v.marque));
  if (v.modele) tags.push(hashtag(v.modele));
  lines.push(tags.join(" "));
  return lines.join("\n");
}
