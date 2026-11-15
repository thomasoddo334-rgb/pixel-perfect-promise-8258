// Single source of truth for JCC Campervans contact details (visitor pages, seller contact sheet, social posts).
export const CONTACTS = [
  { id: "whatsapp", fr: "WhatsApp", en: "WhatsApp", social: "WhatsApp", value: "+33682893113", href: "https://wa.me/33682893113", external: true },
  { id: "phone", fr: "Téléphone", en: "Call", social: "Phone", value: "+64 20 4016 4666", href: "tel:+642040164666", external: false },
  { id: "email", fr: "E-mail", en: "Email", social: "Email", value: "Jcc.campervansnz@gmail.com", href: "mailto:Jcc.campervansnz@gmail.com", external: false },
] as const;

export type ContactId = (typeof CONTACTS)[number]["id"];

// Link for a contact, optionally pre-filled with the van the visitor is asking about.
export function contactHref(c: (typeof CONTACTS)[number], subject?: string): string {
  if (!subject) return c.href;
  if (c.id === "whatsapp") return `${c.href}?text=${encodeURIComponent(`Hi, I'm interested in: ${subject}`)}`;
  if (c.id === "email") return `${c.href}?subject=${encodeURIComponent(subject)}`;
  return c.href;
}

export function buildContactDetails(): string[] {
  return [
    "📞 Contact JCC Campervans NZ",
    ...CONTACTS.map(({ social, value }) => `${social}: ${value}`),
  ];
}
