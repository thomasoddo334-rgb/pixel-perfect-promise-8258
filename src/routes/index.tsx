import { createFileRoute } from "@tanstack/react-router";
import { PublicStockScreen } from "@/components/vans/PublicStockScreen";

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
  component: PublicStockScreen,
});
