import { Link, createFileRoute } from "@tanstack/react-router";
import { PublicVehiclePage } from "@/components/vans/PublicVehiclePage";
import { formatNumber, vehicleTitle } from "@/lib/vans/model";
import { publicVehicleQuery } from "@/lib/vans/public-queries";

// Public, read-only vehicle page: no sign-in, no AppGate, no internal notes.
export const Route = createFileRoute("/public/van/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(publicVehicleQuery(params.id)),
  head: ({ loaderData }) => {
    const title = loaderData ? `${vehicleTitle(loaderData) || loaderData.reference} – JCC Campervans NZ` : "Van indisponible – JCC Campervans NZ";
    const description = loaderData
      ? [
          "Van aménagé à vendre",
          loaderData.kilometrage !== null ? `${formatNumber(loaderData.kilometrage)} km` : null,
          loaderData.prix !== null ? `${formatNumber(loaderData.prix)} NZD` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Ce van n'est plus disponible.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
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
      <h1 className="text-xl font-bold">Ce van n'est plus disponible</h1>
      <p className="mt-2 text-sm text-muted-foreground">Il a peut-être été retiré du catalogue.</p>
      <Link to="/public" className="mt-6 font-semibold text-primary">
        Voir tous les vans
      </Link>
    </main>
  );
}
