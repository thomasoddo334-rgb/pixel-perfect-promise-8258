import { Link, createFileRoute } from "@tanstack/react-router";
import { PublicVehiclePage } from "@/components/vans/PublicVehiclePage";
import { FUEL_EN, GEARBOX_EN, vehicleTitle } from "@/lib/vans/model";
import { formatKm, formatNzd } from "@/lib/vans/public";
import { LOGO_URL, SITE_NAME, SITE_URL, previewImageMeta } from "@/lib/site";
import { publicVehicleQuery } from "@/lib/vans/public-queries";

// Public, read-only vehicle page: no sign-in, no AppGate, no internal notes.
export const Route = createFileRoute("/public/van/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(publicVehicleQuery(params.id)),
  head: ({ loaderData, params }) => {
    const title = loaderData ? `${vehicleTitle(loaderData) || loaderData.reference} – ${SITE_NAME}` : `Van unavailable – ${SITE_NAME}`;
    const description = loaderData
      ? [
          "Campervan for sale",
          loaderData.annee ? String(loaderData.annee) : null,
          loaderData.kilometrage !== null ? formatKm(loaderData.kilometrage) : null,
          loaderData.prix !== null ? `${formatNzd(loaderData.prix)} NZD` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "This van is no longer available.";
    const url = `${SITE_URL}/public/van/${params.id}`;
    const image = loaderData?.photos[0]?.url ?? LOGO_URL;
    // Structured data for Google. A placeholder price (under $1,000) is left out so it never shows in search results.
    const jsonLd = loaderData
      ? {
          "@context": "https://schema.org",
          "@type": "Vehicle",
          name: vehicleTitle(loaderData) || loaderData.reference,
          url,
          image: loaderData.photos.map((p) => p.url),
          vehicleModelDate: loaderData.annee ? String(loaderData.annee) : undefined,
          mileageFromOdometer:
            loaderData.kilometrage !== null ? { "@type": "QuantitativeValue", value: loaderData.kilometrage, unitCode: "KMT" } : undefined,
          fuelType: loaderData.carburant ? (FUEL_EN[loaderData.carburant] ?? loaderData.carburant) : undefined,
          vehicleTransmission: loaderData.boite ? (GEARBOX_EN[loaderData.boite] ?? loaderData.boite) : undefined,
          offers:
            loaderData.prix !== null && loaderData.prix >= 1000
              ? {
                  "@type": "Offer",
                  price: loaderData.prix,
                  priceCurrency: "NZD",
                  availability: loaderData.disponibilite === "Vendu" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
                }
              : undefined,
        }
      : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { "http-equiv": "content-language", content: "en" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...previewImageMeta(image),
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: loaderData ? [{ rel: "canonical", href: url }] : [],
      scripts: jsonLd ? [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }] : [],
    };
  },
  component: PublicVanRoute,
  notFoundComponent: PublicVanNotFound,
});

function PublicVanRoute() {
  const { id } = Route.useParams();
  return <PublicVehiclePage id={id} />;
}

function PublicVanNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-xl font-bold">This van is no longer available</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have been removed from the catalogue.</p>
      <Link to="/public" className="mt-6 font-semibold text-primary">
        See all vans
      </Link>
    </main>
  );
}
