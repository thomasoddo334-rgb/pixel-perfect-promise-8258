import { createFileRoute } from "@tanstack/react-router";
import { AppGate } from "@/components/vans/AppGate";
import { ExportsScreen } from "@/components/vans/ExportsScreen";

export const Route = createFileRoute("/exports")({
  head: () => ({
    meta: [
      { title: "Exporter – Fiches Vans" },
      { name: "description", content: "Exporter les fiches en CSV pour Wix, les photos en ZIP et une sauvegarde complète." },
      { property: "og:title", content: "Exporter – Fiches Vans" },
      { property: "og:description", content: "Exporter les fiches en CSV pour Wix, les photos en ZIP et une sauvegarde complète." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExportsPage,
});

function ExportsPage() {
  return (
    <AppGate>
      <ExportsScreen />
    </AppGate>
  );
}
