import { CloudOff, CloudUpload, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { syncNow, useVans } from "@/lib/vans/store";

export function SyncIndicator({ className }: { className?: string }) {
  const { sync } = useVans();
  const pending = sync.pendingVehicles + sync.pendingPhotos;
  let label: string;
  let Icon = Check;
  let tone = "bg-status-ready/15 text-status-ready";
  if (!sync.online) {
    label = "Hors ligne";
    Icon = CloudOff;
    tone = "bg-muted text-muted-foreground";
  } else if (sync.syncing && pending > 0) {
    label = "Envoi…";
    Icon = RefreshCw;
    tone = "bg-status-complete/15 text-status-complete";
  } else if (pending > 0) {
    label = "En attente d'envoi";
    Icon = CloudUpload;
    tone = "bg-status-progress/15 text-status-progress";
  } else {
    label = "Synchronisé";
  }
  return (
    <button
      type="button"
      onClick={() => void syncNow()}
      title={sync.error ?? undefined}
      aria-label={`${label}${pending ? `, ${pending} en attente` : ""}. Toucher pour synchroniser.`}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
        tone,
        className,
      )}
    >
      <Icon className={cn("size-3.5", sync.syncing && pending > 0 && "animate-spin")} />
      <span>{label}</span>
      {pending > 0 && <span className="tabular-nums opacity-80">· {pending}</span>}
    </button>
  );
}
