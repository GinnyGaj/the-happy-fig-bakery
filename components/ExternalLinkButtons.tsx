const MAPS_URL = "https://maps.app.goo.gl/fnX3CnTg2LuhGzA46";
const WHATSAPP_URL = "https://chat.whatsapp.com/DE2dA3z3Ga53E3TLKq6FH7";

function GoogleMapsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.5 11.5 7 11.94a.75.75 0 0 0 1 0c.5-.44 7-6.69 7-11.94C19.5 5.36 16.14 2 12 2Z"
      />
      <circle cx="12" cy="9.5" r="3.2" fill="#fff" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      <path
        fill="#fff"
        d="M12 5.5a6.4 6.4 0 0 0-5.47 9.72L5.5 18.5l3.4-.98A6.4 6.4 0 1 0 12 5.5Zm0 1.2a5.2 5.2 0 0 1 4.4 7.96 5.2 5.2 0 0 1-8.86-.3l-.15-.26-1.9.55.56-1.85-.17-.28A5.2 5.2 0 0 1 12 6.7Zm-2.53 2.53c-.14 0-.36.05-.55.27-.19.21-.72.7-.72 1.72 0 1.01.74 1.98.84 2.12.1.14 1.44 2.2 3.49 3 1.72.67 2.07.54 2.44.5.37-.03 1.2-.49 1.37-.96.17-.47.17-.87.12-.96-.05-.08-.19-.13-.4-.23-.2-.1-1.2-.6-1.39-.66-.19-.07-.32-.1-.46.1-.14.2-.53.66-.65.8-.12.13-.24.15-.45.05-.2-.1-.86-.32-1.64-1.02-.6-.54-1.01-1.2-1.13-1.4-.12-.2-.01-.3.09-.4.09-.1.2-.24.3-.36.1-.12.13-.2.2-.34.07-.14.03-.26-.02-.37-.05-.1-.46-1.1-.63-1.5-.16-.4-.33-.34-.46-.35Z"
      />
    </svg>
  );
}

function ExternalLinkPill({
  href,
  icon,
  eyebrow,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-sm transition-colors hover:bg-accent sm:flex-none sm:gap-3 sm:px-5 sm:py-2.5"
    >
      {icon}
      <span className="min-w-0 text-left leading-tight">
        <span className="block truncate text-[11px] text-muted-foreground sm:text-xs">{eyebrow}</span>
        <span className="block truncate text-xs font-semibold sm:text-sm">{label}</span>
      </span>
    </a>
  );
}

export function ExternalLinkButtons() {
  return (
    <div className="mt-4 flex flex-nowrap gap-2 sm:gap-3">
      <ExternalLinkPill
        href={MAPS_URL}
        icon={<GoogleMapsIcon />}
        eyebrow="Find us on"
        label="Google Maps"
      />
      <ExternalLinkPill
        href={WHATSAPP_URL}
        icon={<WhatsAppIcon />}
        eyebrow="Join our"
        label="WhatsApp Group"
      />
    </div>
  );
}
