// Public, read-only catalogue endpoints. Visitors are not signed in, so these use the publishable key:
// the database only exposes ready/published vans (without internal notes) and their photos.
import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getPublicVehicles, toPublicVehicle, type PublicVehicle } from "./public";

export type PublicVehicleView = Omit<PublicVehicle, "photos"> & { photos: { url: string; label: string }[] };

const PHOTO_URL_TTL = 60 * 60 * 6;

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function loadPublic(id?: string): Promise<PublicVehicleView[]> {
  const sb = publicClient();
  let query = sb.rpc("get_public_vehicles").order("updated_at", { ascending: false });
  if (id) query = query.eq("id", id);
  const { data, error } = await query;
  if (error) throw new Error("Catalogue indisponible");
  const vans = getPublicVehicles(data ?? [])
    .map((row) => toPublicVehicle(row))
    .filter((v): v is PublicVehicle => v !== null);

  const paths = vans.flatMap((v) => v.photos.map((p) => p.path));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await sb.storage.from("van-photos").createSignedUrls(paths, PHOTO_URL_TTL);
    // Signed URLs are built from the server address; browsers must use the public one.
    const serverBase = process.env["SUPABASE_URL"]!.replace(/\/$/, "");
    const browserBase = (process.env["VITE_SUPABASE_URL"] ?? import.meta.env.VITE_SUPABASE_URL ?? serverBase).replace(/\/$/, "");
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl.replace(serverBase, browserBase));
    }
  }
  return vans.map((v) => ({
    ...v,
    photos: v.photos.flatMap((p) => {
      const url = signed.get(p.path);
      return url ? [{ url, label: p.label }] : [];
    }),
  }));
}

export const listPublicVehicles = createServerFn({ method: "GET" }).handler(() => loadPublic());

export const getPublicVehicle = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.id)) throw notFound();
    return { id: input.id };
  })
  .handler(async ({ data }) => {
    const [van] = await loadPublic(data.id);
    if (!van) throw notFound();
    return van;
  });
