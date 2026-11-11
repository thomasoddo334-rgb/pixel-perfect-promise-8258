import { Link } from "@tanstack/react-router";
import { Camera, Truck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { PhotoImage } from "./PhotoImage";
import { StatusPill } from "./StatusPill";
import { PHOTO_COUNT, computeProgress, formatNumber, normalizePhotos, type Vehicle } from "@/lib/vans/model";

export function VanCard({ v }: { v: Vehicle }) {
  const progress = computeProgress(v);
  const first = normalizePhotos(v.photos)[0];
  const title = [v.marque, v.modele].filter((x) => x.trim()).join(" ") || "Nouveau véhicule";
  const details = [
    v.annee ? String(v.annee) : null,
    v.kilometrage !== null ? `${formatNumber(v.kilometrage)} km` : null,
  ].filter(Boolean);
  let ago = "";
  try {
    ago = formatDistanceToNow(new Date(v.updated_at), { addSuffix: true, locale: fr });
  } catch {
    ago = "";
  }
  return (
    <Link
      to="/van/$id"
      params={{ id: v.id }}
      className="flex gap-3 rounded-2xl bg-card p-3 shadow-card transition-transform active:scale-[0.99]"
    >
      <div className="relative h-[84px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-muted">
        {first?.id ? (
          <PhotoImage vehicleId={v.id} photoId={first.id} alt={title} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Truck className="size-7" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[16px] font-bold leading-tight">{title}</p>
          <p className="shrink-0 text-[15px] font-bold tabular-nums text-primary">
            {v.prix !== null ? `${formatNumber(v.prix)} $` : ""}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {[v.reference, ...details].join(" · ")}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-1.5">
          <StatusPill status={progress.status} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums">
            <Camera className="size-3.5" />
            {progress.photosWithImage}/{PHOTO_COUNT}
          </span>
          {v.disponibilite !== "Disponible" && (
            <span className="text-xs font-semibold text-muted-foreground">· {v.disponibilite}</span>
          )}
        </div>
        <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
          Modifié{v.updated_by_name ? ` par ${v.updated_by_name}` : ""} {ago}
        </p>
      </div>
    </Link>
  );
}
