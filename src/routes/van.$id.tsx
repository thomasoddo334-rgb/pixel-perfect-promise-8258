import { createFileRoute } from "@tanstack/react-router";
import { AppGate } from "@/components/vans/AppGate";
import { noIndex } from "@/lib/site";
import { VehicleSheet } from "@/components/vans/VehicleSheet";

export const Route = createFileRoute("/van/$id")({
  head: () => ({
    meta: [
      { title: "Fiche véhicule – Fiches Vans" },
      { name: "description", content: "Saisie de la fiche d'un van aménagé : caractéristiques, équipements et photos." },
      { property: "og:title", content: "Fiche véhicule – Fiches Vans" },
      { property: "og:description", content: "Saisie de la fiche d'un van aménagé : caractéristiques, équipements et photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      noIndex,
    ],
  }),
  component: VanPage,
});

function VanPage() {
  const { id } = Route.useParams();
  return (
    <AppGate>
      <VehicleSheet id={id} />
    </AppGate>
  );
}
