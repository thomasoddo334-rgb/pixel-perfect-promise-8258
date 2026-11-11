import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import { AppGate } from "@/components/vans/AppGate";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact – Fiches Vans" },
      { name: "description", content: "Coordonnées de JCC Campervans NZ : WhatsApp, téléphone et e-mail." },
      { property: "og:title", content: "Contact – Fiches Vans" },
      { property: "og:description", content: "Coordonnées de JCC Campervans NZ : WhatsApp, téléphone et e-mail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

const contacts = [
  { label: "WhatsApp", value: "+33682893113", href: "https://wa.me/33682893113", icon: MessageCircle, external: true },
  { label: "Phone", value: "+64 20 4016 4666", href: "tel:+642040164666", icon: Phone, external: false },
  { label: "Mail", value: "Jcc.campervansnz@gmail.com", href: "mailto:Jcc.campervansnz@gmail.com", icon: Mail, external: false },
];

function ContactPage() {
  return (
    <AppGate>
      <div className="min-h-dvh bg-background">
        <header className="pt-safe border-b bg-background">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
            <Button asChild variant="ghost" size="icon" aria-label="Retour au stock">
              <Link to="/"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-[22px] font-extrabold">Contact</h1>
          </div>
        </header>
        <main className="pb-safe mx-auto max-w-3xl px-5 pt-8">
          <h2 className="text-2xl font-bold">JCC Campervans NZ</h2>
          <address className="mt-6 divide-y border-y not-italic">
            {contacts.map(({ label, value, href, icon: Icon, external }) => (
              <Button key={label} asChild variant="ghost" className="h-auto w-full justify-start gap-4 rounded-none px-0 py-5 whitespace-normal">
                <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="mt-1 block break-words text-base font-semibold">{value}</span>
                  </span>
                  <ArrowUpRight className="text-muted-foreground" />
                </a>
              </Button>
            ))}
          </address>
        </main>
      </div>
    </AppGate>
  );
}