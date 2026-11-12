import { describe, expect, it } from "vitest";
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { newVehicle, type Vehicle } from "@/lib/vans/model";
import { getPublicVehicles, isPublicVehicle, toPublicVehicle } from "@/lib/vans/public";
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
    expect(pub?.photos.map((p) => p.label)).toEqual(["Avant", "Côté"]);
  });
  it("serves /public and /public/van/$id as their own pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/public").at(-1)?.routeId).toBe("/public/");
    expect(router.matchRoutes("/public/van/abc").at(-1)?.routeId).toBe("/public/van/$id");
  });
});
