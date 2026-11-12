import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACTS } from "@/lib/contact";

const ICONS = { WhatsApp: MessageCircle, Phone, Mail } as const;

export function PublicContact({ subject }: { subject?: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CONTACTS.map((c) => {
        const Icon = ICONS[c.label];
        const external = c.label === "WhatsApp";
        let href: string = c.href;
        if (subject && c.label === "WhatsApp") href = `${c.href}?text=${encodeURIComponent(subject)}`;
        if (subject && c.label === "Mail") href = `${c.href}?subject=${encodeURIComponent(subject)}`;
        return (
          <Button key={c.label} asChild variant={external ? "default" : "outline"} size="lg" className="flex-col gap-1 py-2 h-auto">
            <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
              <Icon className="size-5" />
              <span className="text-xs">{c.label === "Phone" ? "Appeler" : c.label}</span>
            </a>
          </Button>
        );
      })}
    </div>
  );
}
