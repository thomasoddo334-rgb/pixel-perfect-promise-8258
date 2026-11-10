import { createFileRoute } from "@tanstack/react-router";
import { AppGate } from "@/components/vans/AppGate";
import { StockScreen } from "@/components/vans/StockScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stock – Fiches Vans" },
      { name: "description", content: "Tous les vans aménagés en préparation, avec leur avancement." },
      { property: "og:title", content: "Stock – Fiches Vans" },
      { property: "og:description", content: "Tous les vans aménagés en préparation, avec leur avancement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppGate>
      <StockScreen />
    </AppGate>
  );
}
