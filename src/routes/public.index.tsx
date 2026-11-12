import { createFileRoute } from "@tanstack/react-router";
import { PublicStockScreen } from "@/components/vans/PublicStockScreen";
import { publicVehiclesQuery } from "@/lib/vans/public-queries";

const TITLE = "Vans à vendre – JCC Campervans NZ";
const DESCRIPTION = "Vans aménagés disponibles à la vente en Nouvelle-Zélande : prix, kilométrage, équipements et photos.";

// Public, read-only catalogue: no sign-in, no AppGate.
export const Route = createFileRoute("/public/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicVehiclesQuery()),
  component: PublicStockScreen,
});
