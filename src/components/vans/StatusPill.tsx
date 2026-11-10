import { cn } from "@/lib/utils";
import { STATUS_LABEL, type StatusKey } from "@/lib/vans/model";

const STYLES: Record<StatusKey, string> = {
  a_renseigner: "bg-status-todo/15 text-status-todo",
  en_cours: "bg-status-progress/15 text-status-progress",
  complete: "bg-status-complete/15 text-status-complete",
  pret: "bg-status-ready/15 text-status-ready",
  publie: "bg-status-published/15 text-status-published",
};
const DOTS: Record<StatusKey, string> = {
  a_renseigner: "bg-status-todo",
  en_cours: "bg-status-progress",
  complete: "bg-status-complete",
  pret: "bg-status-ready",
  publie: "bg-status-published",
};

export function StatusDot({ status, className }: { status: StatusKey; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", DOTS[status], className)} />;
}

export function StatusPill({ status, className }: { status: StatusKey; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status],
        className,
      )}
    >
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}
