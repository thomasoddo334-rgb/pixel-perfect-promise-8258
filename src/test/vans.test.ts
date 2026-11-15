import { describe, expect, it } from "vitest";
import { PHOTO_COUNT, extraPhotos, fixedPhotos, normalizePhotos, computeProgress, generateReference, newVehicle, orderedPhotoFiles, photoFileName, type Vehicle } from "@/lib/vans/model";
import { CSV_COLUMNS, buildSocialPost, buildWixCsv } from "@/lib/vans/exports";

function base(): Vehicle {
  return newVehicle({ id: "1", reference: "VAN-A24H", now: "2026-01-01T00:00:00Z", userId: null, userName: null });
}
function complete(): Vehicle {
  return {
    ...base(),
    marque: "Toyota",
    modele: "Hiace",
    plaque: "ABC123",
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
  it("has exactly 10 fixed photo slots", () => {
    expect(PHOTO_COUNT).toBe(10);
    expect(base().photos).toHaveLength(10);
    expect(() => photoFileName("VAN-A24H", 10)).toThrow();
  });
  it("keeps photos from old spare slots 11-20 as extra photos, in order", () => {
    const old = [...complete().photos, { id: null, na: false }, { id: "x12", na: false }, { id: "x13", na: false }];
    expect(fixedPhotos(old)).toHaveLength(10);
    expect(extraPhotos(old)).toEqual(["x12", "x13"]);
    expect(normalizePhotos(old)).toHaveLength(12);
  });
  it("extra photos are optional and never change progress", () => {
    const v = complete();
    const before = computeProgress(v);
    v.photos = [...normalizePhotos(v.photos), ...Array.from({ length: 30 }, (_, i) => ({ id: `e${i}`, na: false }))];
    const after = computeProgress(v);
    expect(after.isComplete).toBe(true);
    expect(after.percent).toBe(100);
    expect(after.photosDone).toBe(before.photosDone);
  });
  it("extra photos are named REF_11.jpg, REF_12.jpg after the fixed ones", () => {
    const v = { ...complete(), photos: [...complete().photos, { id: "e0", na: false }, { id: "e1", na: false }] };
    const names = orderedPhotoFiles(v).map((f) => f.name);
    expect(names.at(-2)).toBe("VAN-A24H_11.jpg");
    expect(names.at(-1)).toBe("VAN-A24H_12.jpg");
    expect(names[0]).toBe("VAN-A24H_01_avant.jpg");
  });
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
    const header = (csv.slice(1).split("\r\n")[0] ?? "").split(",");
    expect(header).toEqual(CSV_COLUMNS);
    expect(header.slice(-12)).toEqual(["photo_principale", ...Array.from({ length: 10 }, (_, i) => `photo_${i + 1}`), "photos_supplementaires"]);
    expect(header).not.toContain("chauffage");
  });
  it("photo columns hold ZIP file names, empty for Pas concerné", () => {
    const row = (buildWixCsv([complete()]).slice(1).split("\r\n")[1] ?? "").split(",");
    const idx = (c: string) => CSV_COLUMNS.indexOf(c);
    expect(row[idx("photo_principale")]).toBe("VAN-A24H_01_avant.jpg");
    expect(row[idx("photo_8")]).toBe("");
    expect(row[idx("wof")]).toBe("Non");
    expect(row[idx("statut")]).toBe("Complète");
  });
  it("lists extra photo file names separated by |", () => {
    const v = { ...complete(), photos: [...complete().photos, { id: "e0", na: false }, { id: "e1", na: false }] };
    const row = (buildWixCsv([v]).slice(1).split("\r\n")[1] ?? "").split(",");
    expect(row[CSV_COLUMNS.indexOf("photos_supplementaires")]).toBe("VAN-A24H_11.jpg | VAN-A24H_12.jpg");
  });
  it("ignores an old stored Chauffage option", () => {
    const csv = buildWixCsv([{ ...complete(), equipements: ["chauffage", "douche"] }]);
    expect(csv).not.toContain("Chauffage");
  });
});

describe("social post", () => {
  const v: Vehicle = { ...complete(), equipements: ["cuisine", "chauffage", "panneaux_solaires"], wof: true, boite: "Automatique", carburant: "Pétrole" };
  const text = buildSocialPost(v);
  it("is written in English", () => {
    expect(text).toContain("Mileage: 185,000 km");
    expect(text).toContain("Automatic");
    expect(text).toContain("Petrol");
    expect(text).toContain("Price: $24,500 NZD");
    expect(text).toContain("Equipment: Kitchen, Solar panels");
    expect(text).toContain("WOF and rego available for one year");
    expect(text).toContain("#nzvanlife");
  });
  it("contains no French labels or Chauffage", () => {
    for (const word of ["Kilométrage", "Prix", "Équipements", "Année", "Chauffage", "Heating", "#nouvellezelande"]) expect(text).not.toContain(word);
  });
});
