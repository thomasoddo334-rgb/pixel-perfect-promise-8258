import { describe, expect, it } from "vitest";
import { computeProgress, generateReference, newVehicle, photoFileName, type Vehicle } from "@/lib/vans/model";
import { CSV_COLUMNS, buildWixCsv } from "@/lib/vans/exports";

function base(): Vehicle {
  return newVehicle({ id: "1", reference: "VAN-A24H", now: "2026-01-01T00:00:00Z", userId: null, userName: null });
}
function complete(): Vehicle {
  return {
    ...base(),
    marque: "Toyota",
    modele: "Hiace",
    annee: 2014,
    kilometrage: 185000,
    motorisation: "3.0 TD",
    boite: "Manuelle",
    carburant: "Diesel",
    places: 3,
    couchages: 2,
    prix: 24500,
    photos: Array.from({ length: 10 }, (_, i) => (i === 7 ? { id: null, na: true } : { id: `p${i}`, na: false })),
  };
}

describe("status rules", () => {
  it("empty sheet is À renseigner", () => {
    expect(computeProgress(base()).status).toBe("a_renseigner");
  });
  it("partial sheet is En cours", () => {
    expect(computeProgress({ ...base(), marque: "Toyota" }).status).toBe("en_cours");
  });
  it("all required fields + 10 photos or Pas concerné is Complète", () => {
    const p = computeProgress(complete());
    expect(p.status).toBe("complete");
    expect(p.percent).toBe(100);
  });
  it("a missing photo keeps it En cours and lists it", () => {
    const v = complete();
    v.photos[9] = { id: null, na: false };
    const p = computeProgress(v);
    expect(p.status).toBe("en_cours");
    expect(p.missingPhotos).toEqual(["10 Détail"]);
  });
  it("photo 1 cannot be Pas concerné", () => {
    const v = complete();
    v.photos[0] = { id: null, na: true };
    expect(computeProgress(v).status).toBe("en_cours");
  });
  it("Prêt à publier / Publié only apply when complete", () => {
    expect(computeProgress({ ...complete(), publication: "pret" }).status).toBe("pret");
    expect(computeProgress({ ...complete(), publication: "publie" }).status).toBe("publie");
    expect(computeProgress({ ...base(), marque: "X", publication: "publie" }).status).toBe("en_cours");
  });
});

describe("references and files", () => {
  it("references look like VAN-XXXX and are unique", () => {
    const ref = generateReference(["VAN-AAAA"]);
    expect(ref).toMatch(/^VAN-[A-Z0-9]{4}$/);
    expect(ref).not.toBe("VAN-AAAA");
  });
  it("photo files are named REF_01_avant.jpg", () => {
    expect(photoFileName("VAN-A24H", 0)).toBe("VAN-A24H_01_avant.jpg");
    expect(photoFileName("VAN-A24H", 1)).toBe("VAN-A24H_02_arriere.jpg");
    expect(photoFileName("VAN-A24H", 7)).toBe("VAN-A24H_08_salle-d-eau.jpg");
  });
});

describe("Wix CSV", () => {
  it("starts with a UTF-8 BOM and the expected columns", () => {
    const csv = buildWixCsv([complete()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const header = csv.slice(1).split("\r\n")[0].split(",");
    expect(header).toEqual(CSV_COLUMNS);
    expect(header.slice(-11)).toEqual(["photo_principale", ...Array.from({ length: 10 }, (_, i) => `photo_${i + 1}`)]);
  });
  it("photo columns hold ZIP file names, empty for Pas concerné", () => {
    const row = buildWixCsv([complete()]).slice(1).split("\r\n")[1].split(",");
    const idx = (c: string) => CSV_COLUMNS.indexOf(c);
    expect(row[idx("photo_principale")]).toBe("VAN-A24H_01_avant.jpg");
    expect(row[idx("photo_8")]).toBe("");
    expect(row[idx("wof")]).toBe("Non");
    expect(row[idx("statut")]).toBe("Complète");
  });
});
