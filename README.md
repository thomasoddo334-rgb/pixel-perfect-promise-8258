# JCC Campervans – Fiches Vans

Application de préparation des fiches véhicules et catalogue visiteur de **JCC Campervans NZ**.

- **Espace équipe** (`/`) : stock, fiches véhicules (10 photos fixes + photos supplémentaires, plaque d'immatriculation), suivi des statuts, exports (CSV Wix, ZIP des photos, sauvegarde JSON, texte Facebook/Instagram). Connexion Google réservée à une liste d'adresses autorisées. Fonctionne hors ligne et s'installe sur l'écran d'accueil de l'iPhone.
- **Catalogue visiteur** (`/public`, `/public/van/:id`) : en anglais, sans connexion, lecture seule. Seuls les vans « Prêt à publier » ou « Publié » apparaissent ; les notes internes ne sont jamais exposées.

**Application en ligne** : https://pixel-perfect-promise-8258.lovable.app

## Technique

TanStack Start (React 19) · Tailwind CSS 4 · Supabase (base, stockage photos, authentification) · PWA hors ligne (IndexedDB + service worker).

```sh
bun install   # ou npm install
bun run dev   # serveur local
bun run test  # tests
bun run build # build de production
```

## Points d'attention

- Coordonnées de contact : `src/lib/contact.ts` (une seule source pour le site, la fiche contact et les posts).
- Adresse publique du site (aperçus de partage, sitemap) : `src/lib/site.ts` et `public/robots.txt`, `public/sitemap.xml`. À modifier si un nom de domaine personnalisé est connecté.
- Base de données : le champ `plaque` doit exister dans la table `vehicles` (voir `drizzle/migrations/0003_vehicles_plaque.sql`).
- Projet synchronisé avec [Lovable](https://lovable.dev) : voir `AGENTS.md` avant de modifier l'historique git ou le schéma.
