import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePhotoUrl } from "@/lib/vans/photo-cache";

export function PhotoImage({
  vehicleId,
  photoId,
  alt,
  className,
}: {
  vehicleId: string;
  photoId: string;
  alt: string;
  className?: string;
}) {
  const { url, missing } = usePhotoUrl(vehicleId, photoId);
  if (url) return <img src={url} alt={alt} className={cn("h-full w-full object-cover", className)} draggable={false} />;
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-muted text-muted-foreground", className)}>
      {missing ? <ImageOff className="size-5" aria-label="Photo pas encore disponible" /> : <Loader2 className="size-5 animate-spin" />}
    </div>
  );
}
