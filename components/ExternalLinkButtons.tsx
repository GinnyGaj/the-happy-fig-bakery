const MAPS_URL = "https://maps.app.goo.gl/fnX3CnTg2LuhGzA46";
const WHATSAPP_URL = "https://chat.whatsapp.com/DE2dA3z3Ga53E3TLKq6FH7";

function GoogleMapsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      <path
        fill="#fff"
        d="M17.47 6.52A7.37 7.37 0 0 0 12.03 4.3a7.44 7.44 0 0 0-6.45 11.13L4.5 19.5l4.19-1.1a7.4 7.4 0 0 0 3.34.81h.01a7.44 7.44 0 0 0 5.26-12.69Zm-5.44 11.4h-.01a6.17 6.17 0 0 1-3.15-.86l-.23-.14-2.49.65.66-2.43-.15-.25a6.19 6.19 0 0 1 9.55-7.68 6.14 6.14 0 0 1 1.82 4.39 6.19 6.19 0 0 1-6 6.32Zm3.39-4.63c-.19-.09-1.1-.54-1.27-.6-.17-.06-.3-.09-.42.1-.12.19-.48.6-.59.72-.11.12-.22.14-.4.05-.19-.09-.79-.29-1.5-.92a5.62 5.62 0 0 1-1.04-1.29c-.11-.19-.01-.29.08-.38.09-.09.19-.22.29-.34.1-.11.13-.19.19-.32.06-.13.03-.24-.02-.34-.05-.09-.42-1.01-.57-1.38-.15-.36-.31-.31-.42-.32-.11 0-.24-.01-.36-.01a.7.7 0 0 0-.51.24c-.18.19-.67.65-.67 1.59s.68 1.85.78 1.98c.09.12 1.34 2.05 3.26 2.87.46.2.81.31 1.09.4.46.15.87.13 1.2.08.37-.06 1.1-.45 1.25-.88.16-.44.16-.81.11-.89-.05-.08-.17-.13-.36-.22Z"
      />
    </svg>
  );
}

function ExternalLinkIconButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-accent"
    >
      {icon}
    </a>
  );
}

export function ExternalLinkButtons() {
  return (
    <div className="flex flex-none items-center gap-2">
      <ExternalLinkIconButton href={MAPS_URL} icon={<GoogleMapsIcon />} label="Find us on Google Maps" />
      <ExternalLinkIconButton href={WHATSAPP_URL} icon={<WhatsAppIcon />} label="Join our WhatsApp Group" />
    </div>
  );
}
