import { queryOptions } from "@tanstack/react-query";
import { getPublicVehicle, listPublicVehicles } from "./public.functions";

const STALE = 1000 * 60 * 30;

export const publicVehiclesQuery = () =>
  queryOptions({ queryKey: ["public-vehicles"], queryFn: () => listPublicVehicles(), staleTime: STALE });

export const publicVehicleQuery = (id: string) =>
  queryOptions({ queryKey: ["public-vehicle", id], queryFn: () => getPublicVehicle({ data: { id } }), staleTime: STALE });
