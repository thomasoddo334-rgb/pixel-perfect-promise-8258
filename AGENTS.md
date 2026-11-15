<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep photo slot definitions and WOF wording in the pure vehicle model so the sheet and exports stay consistent.
- Store photos as one list: the fixed required slots first, then optional extra photos (ids only); compute completion from the fixed slots only, and read old spare slots as extras so no photo is lost.
- Scope visitor-catalogue branding with the `brand-public` class and `brand-*` tokens so seller pages keep the app theme.
- Keep the business contact sheet on its own gated route, accessible from the stock menu, so contact details do not become vehicle fields.
- Serve the visitor catalogue (/public, /public/van/$id) outside AppGate through the `get_public_vehicles` database function and the public-photo storage policy, so visitors never read the vehicles table or internal notes directly.
- Visitor catalogue text is English; the seller app stays French. Contact details live only in `src/lib/contact.ts`.
