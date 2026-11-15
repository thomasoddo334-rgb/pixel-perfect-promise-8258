// Site-wide constants for sharing and search engines.
import logo from "@/assets/jcc-campervans-logo.jpg.asset.json";

// Public address of the visitor site. Change it here if a custom domain is connected.
export const SITE_URL = "https://pixel-perfect-promise-8258.lovable.app";
export const SITE_NAME = "JCC Campervans NZ";
export const LOGO_URL = `${SITE_URL}${logo.url}`;

// Seller-only pages (stock, sheets, exports, contact sheet): keep them out of search engines.
export const noIndex = { name: "robots", content: "noindex, nofollow" } as const;

// Link-preview image for Facebook, WhatsApp, iMessage, etc.
export function previewImageMeta(imageUrl: string) {
  return [
    { property: "og:image", content: imageUrl },
    { name: "twitter:image", content: imageUrl },
  ];
}
