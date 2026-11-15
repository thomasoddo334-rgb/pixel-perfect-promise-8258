import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACTS, contactHref, type ContactId } from "@/lib/contact";

const ICONS: Record<ContactId, typeof Phone> = { whatsapp: MessageCircle, phone: Phone, email: Mail };

export function PublicContact({ subject }: { subject?: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CONTACTS.map((c) => {
        const Icon = ICONS[c.id];
        return (
          <Button key={c.id} asChild variant={c.id === "whatsapp" ? "default" : "outline"} size="lg" className="h-auto flex-col gap-1 py-2">
            <a href={contactHref(c, subject)} target={c.external ? "_blank" : undefined} rel={c.external ? "noopener noreferrer" : undefined}>
              <Icon className="size-5" />
              <span className="text-xs">{c.en}</span>
            </a>
          </Button>
        );
      })}
    </div>
  );
}

// Always-visible contact bar for the bottom of a van page.
export function ContactBar({ subject }: { subject: string }) {
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-2.5">
        <PublicContact subject={subject} />
      </div>
    </div>
  );
}
