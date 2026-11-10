import { cn } from "@/lib/utils";

type Option<T> = { value: T; label: string };

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  columns,
  allowDeselect = true,
  ariaLabel,
}: {
  options: Option<T>[];
  value: T | null;
  onChange: (v: T | null) => void;
  columns?: number;
  allowDeselect?: boolean;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active && allowDeselect ? null : o.value)}
            className={cn(
              "h-12 rounded-xl border px-2 text-[15px] font-semibold transition-all active:scale-[0.97]",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-input bg-card text-foreground hover:bg-accent",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center gap-2 rounded-xl border px-3 text-left text-[15px] font-medium transition-all active:scale-[0.97]",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-input bg-card text-foreground hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-bold",
          active ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
        aria-hidden
      >
        {active ? "✓" : ""}
      </span>
      {children}
    </button>
  );
}
