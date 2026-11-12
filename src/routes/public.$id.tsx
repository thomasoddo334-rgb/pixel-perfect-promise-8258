import { createFileRoute } from "@tanstack/react-router";
import { PublicVehicleSheet } from "@/components/vans/PublicVehicleSheet";

export const Route = createFileRoute("/public/$id")({
  head: () => ({
    meta: [
      { title: "Fiche véhicule – Catalogue public" },
      { name: "description", content: "Détails publics d’un van en vente." },
      { property: "og:title", content: "Fiche véhicule – Catalogue public" },
      { property: "og:description", content: "Détails publics d’un van en vente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicVehiclePage,
});

function PublicVehiclePage() {
  const { id } = Route.useParams();
  return <PublicVehicleSheet id={id} />;
}
