import { createFileRoute } from "@tanstack/react-router";
import { PublicStockScreen } from "@/components/vans/PublicStockScreen";
import { LOGO_URL, SITE_URL, previewImageMeta } from "@/lib/site";
import { publicVehiclesQuery } from "@/lib/vans/public-queries";

const TITLE = "Campervans for Sale – JCC Campervans NZ";
const DESCRIPTION = "Converted campervans for sale in New Zealand: price, mileage, equipment and photos. WOF & rego included.";

// Public, read-only catalogue: no sign-in, no AppGate.
export const Route = createFileRoute("/public/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { "http-equiv": "content-language", content: "en" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/public` },
      { name: "twitter:card", content: "summary_large_image" },
      ...previewImageMeta(LOGO_URL),
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/public` }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicVehiclesQuery()),
  component: PublicStockScreen,
});
