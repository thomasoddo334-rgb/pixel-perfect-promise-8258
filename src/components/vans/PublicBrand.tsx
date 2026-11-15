// JCC Campervans branding for the visitor catalogue. The logo file is used exactly as supplied.
import { Link } from "@tanstack/react-router";
import logo from "@/assets/jcc-campervans-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "JCC Campervans";

export function BrandLogo({ className, eager }: { className?: string; eager?: boolean }) {
  return (
    <img
      src={logo.url}
      alt={BRAND_NAME}
      width={1500}
      height={1500}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cn("aspect-square select-none rounded-2xl object-contain", className)}
    />
  );
}

export function BrandFooter({ teamLink }: { teamLink?: boolean }) {
  return (
    <footer className="mt-8 flex flex-col items-center rounded-2xl bg-brand px-4 pb-5 pt-4 text-center">
      <BrandLogo className="size-24 md:size-28" />
      <p className="mt-1 text-xs font-medium text-brand-foreground/75">© {new Date().getFullYear()} {BRAND_NAME}</p>
      {teamLink && (
        <Link to="/" className="mt-3 text-[11px] text-brand-foreground/50 underline-offset-2 hover:text-brand-foreground/80 hover:underline">
          Team access
        </Link>
      )}
    </footer>
  );
}
