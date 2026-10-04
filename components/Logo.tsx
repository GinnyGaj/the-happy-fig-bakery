// v1: original text-only wordmark lockup (used in Header/Footer before the SVG badge)
export function LogoV1() {
  return (
    <span className="flex flex-col leading-tight">
      <span className="font-display text-2xl">The Happy Fig</span>
      <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        HOME BAKERY
      </span>
    </span>
  );
}

// v2: circular badge logo (house icon + wordmark), recreated as a crisp inline SVG
export function LogoV2({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="The Happy Fig — Home Bakery"
    >
      <circle
        cx="200"
        cy="200"
        r="156"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="2.5"
      />

      <g transform="translate(200, 128)" stroke="var(--foreground)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* chimney smoke */}
        <path d="M 13 -38 C 10 -42, 16 -46, 13 -50" />
        {/* roof */}
        <path d="M -32 -8 L 0 -32 L 32 -8" fill="var(--accent)" />
        <path d="M 6 -30 L 6 -40 L 16 -40 L 16 -22" fill="var(--accent)" />
        {/* house body */}
        <rect x="-24" y="-8" width="48" height="36" fill="var(--card)" />
        {/* door */}
        <path d="M -8 28 L -8 10 C -8 4, -2 1, 3 1 C 8 1, 8 8, 8 10 L 8 28" fill="none" />
        {/* window */}
        <rect x="10" y="4" width="12" height="12" />
        <line x1="16" y1="4" x2="16" y2="16" />
        <line x1="10" y1="10" x2="22" y2="10" />
        {/* ground line + flower */}
        <line x1="-28" y1="28" x2="30" y2="28" />
        <path d="M 24 28 C 22 20, 26 16, 28 10" strokeWidth="1.5" />
        <circle cx="28.5" cy="9" r="1.6" fill="var(--foreground)" stroke="none" />
      </g>

      <text
        x="200"
        y="238"
        textAnchor="middle"
        fontFamily="var(--font-fraunces), serif"
        fontSize="54"
        fill="var(--foreground)"
      >
        The Happy Fig
      </text>

      <text
        x="200"
        y="270"
        textAnchor="middle"
        fontFamily="var(--font-karla), sans-serif"
        fontSize="16"
        letterSpacing="6"
        fill="var(--primary)"
      >
        HOME BAKERY
      </text>
    </svg>
  );
}

export { LogoV2 as Logo };
