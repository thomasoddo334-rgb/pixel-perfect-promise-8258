export const CONTACTS = [
  { label: "WhatsApp", value: "+33682893113", href: "https://wa.me/33682893113" },
  { label: "Phone", value: "+64 20 4016 4666", href: "tel:+642040164666" },
  { label: "Mail", value: "Jcc.campervansnz@gmail.com", href: "mailto:Jcc.campervansnz@gmail.com" },
] as const;

export function buildContactDetails(): string[] {
  return [
    "📞 Contact JCC Campervans NZ",
    ...CONTACTS.map(({ label, value }) => `${label}: ${value}`),
  ];
}
