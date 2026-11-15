import { describe, expect, it } from "vitest";
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { newVehicle, type Vehicle } from "@/lib/vans/model";
import { NO_PUBLIC_FILTERS, filterPublicVehicles, formatKm, formatNzd, getPublicVehicles, isPublicVehicle, sortPublicVehicles, toPublicVehicle } from "@/lib/vans/public";
import { WOF_LABEL } from "@/lib/vans/model";
import { routeTree } from "@/routeTree.gen";

function van(publication: Vehicle["publication"], extra: Partial<Vehicle> = {}): Vehicle {
  return {
    ...newVehicle({ id: "11111111-1111-1111-1111-111111111111", reference: "VAN-A24H", now: "2026-01-01T00:00:00Z", userId: null, userName: null }),
    publication,
    ...extra,
  };
}

describe("public catalogue", () => {
  it("shows a van marked Prêt à publier", () => {
    expect(isPublicVehicle(van("pret"))).toBe(true);
  });
  it("shows a van marked Publié", () => {
    expect(isPublicVehicle(van("publie"))).toBe(true);
  });
  it("hides a van that is not marked ready or published", () => {
    expect(isPublicVehicle(van(null))).toBe(false);
  });
  it("hides a deleted van even if it was published", () => {
    expect(isPublicVehicle(van("publie", { deleted: true }))).toBe(false);
  });
  it("keeps only public vans in the list", () => {
    const list = [van("pret", { reference: "A" }), van(null, { reference: "B" }), van("publie", { reference: "C" })];
    expect(getPublicVehicles(list).map((v) => v.reference)).toEqual(["A", "C"]);
  });
  it("never exposes the internal note to visitors", () => {
    const pub = toPublicVehicle(van("pret", { remarque: "Note interne : prix plancher 20000" }));
    expect(pub).not.toBeNull();
    expect(JSON.stringify(pub)).not.toContain("prix plancher");
    expect(pub && "remarque" in pub).toBe(false);
  });
  it("lists only photos that exist, in slot order", () => {
    const photos = Array.from({ length: 20 }, (_, i) => (i === 0 ? { id: "p0", na: false } : i === 2 ? { id: "p2", na: false } : { id: null, na: i === 1 }));
    const pub = toPublicVehicle(van("pret", { photos }));
    expect(pub?.photos.map((p) => p.label)).toEqual(["Front", "Side"]);
  });
  it("serves /public and /public/van/$id as their own pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/public").at(-1)?.routeId).toBe("/public/");
    expect(router.matchRoutes("/public/van/abc").at(-1)?.routeId).toBe("/public/van/$id");
  });
});

describe("visitor catalogue helpers", () => {
  const mk = (disponibilite: string, prix: number | null, annee: number | null, kilometrage: number | null, marque = "Toyota", boite: string | null = "Manuelle") => ({
    disponibilite, prix, annee, kilometrage, marque, modele: "Hiace", reference: `R${prix}${annee}`, boite, carburant: "Diesel",
  });
  it("puts available vans first, then reserved, then sold, whatever the sort", () => {
    const list = [mk("Vendu", 1000, 2000, 1), mk("Disponible", 9000, 2001, 2), mk("Réservé", 5000, 2002, 3), mk("Disponible", 7000, 2003, 4)];
    expect(sortPublicVehicles(list, "price_asc").map((v) => v.disponibilite)).toEqual(["Disponible", "Disponible", "Réservé", "Vendu"]);
    expect(sortPublicVehicles(list, "price_asc").map((v) => v.prix)).toEqual([7000, 9000, 5000, 1000]);
  });
  it("sorts by price, year and mileage, with missing values last", () => {
    const list = [mk("Disponible", null, 1999, 300), mk("Disponible", 8000, null, 100), mk("Disponible", 6000, 2005, null)];
    expect(sortPublicVehicles(list, "price_asc").map((v) => v.prix)).toEqual([6000, 8000, null]);
    expect(sortPublicVehicles(list, "price_desc").map((v) => v.prix)).toEqual([8000, 6000, null]);
    expect(sortPublicVehicles(list, "year_desc").map((v) => v.annee)).toEqual([2005, 1999, null]);
    expect(sortPublicVehicles(list, "km_asc").map((v) => v.kilometrage)).toEqual([100, 300, null]);
  });
  it("keeps the incoming order for newest", () => {
    const list = [mk("Disponible", 3, 2000, 1), mk("Disponible", 1, 2001, 2)];
    expect(sortPublicVehicles(list, "newest")).toEqual(list);
  });
  it("filters by text and transmission", () => {
    const list = [mk("Disponible", 1, 2000, 1, "Toyota", "Manuelle"), mk("Disponible", 2, 2000, 1, "Nissan", "Automatique")];
    expect(filterPublicVehicles(list, { ...NO_PUBLIC_FILTERS, search: "niss" })).toHaveLength(1);
    expect(filterPublicVehicles(list, { ...NO_PUBLIC_FILTERS, boite: "Automatique" })[0]?.marque).toBe("Nissan");
    expect(filterPublicVehicles(list, NO_PUBLIC_FILTERS)).toHaveLength(2);
  });
  it("formats NZ prices and mileage in English", () => {
    expect(formatNzd(23000)).toBe("$23,000");
    expect(formatKm(342830)).toBe("342,830 km");
  });
  it("uses the corrected WOF wording", () => {
    expect(WOF_LABEL).toBe("WOF & rego valid for 1 year");
  });
});
