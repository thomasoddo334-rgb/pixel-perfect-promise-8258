// Single place that registers the offline service worker. Never in dev, iframes or Lovable previews.
const SW_URL = "/sw.js";

function isPreviewHost(host: string): boolean {
  const onLovable = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
  const firstLabel = host.split(".")[0];
  if (onLovable && /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(firstLabel)) return true;
  if (onLovable && /^project--[a-z0-9-]+-dev$/.test(firstLabel)) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.filter((r) => (r.active ?? r.waiting ?? r.installing)?.scriptURL.endsWith(SW_URL)).map((r) => r.unregister()),
  );
}

export function registerOfflineWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const host = window.location.hostname.toLowerCase();
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const killSwitch = new URLSearchParams(window.location.search).get("sw") === "off";
  if (!import.meta.env.PROD || inIframe || isPreviewHost(host) || killSwitch) {
    void unregisterAppWorkers();
    return;
  }
  void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch((e) => console.warn("SW", e));
}
