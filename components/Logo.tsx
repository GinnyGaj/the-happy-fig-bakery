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

      <g transform="translate(200, 150)" stroke="var(--foreground)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* chimney */}
        <rect x="10" y="-54" width="10" height="20" fill="var(--card)" />
        {/* chimney smoke */}
        <path d="M 19 -58 C 16 -62, 21 -65, 18 -69" strokeWidth="1.6" />
        {/* roof */}
        <path d="M -40 -8 L 0 -44 L 40 -8 Z" fill="var(--accent)" strokeLinejoin="round" />
        {/* house body */}
        <rect x="-28" y="-8" width="56" height="42" fill="var(--card)" />
        {/* door */}
        <path d="M -14 34 L -14 12 C -14 5, -8 1, -3 1 C 2 1, 8 5, 8 12 L 8 34" fill="none" />
        {/* window */}
        <rect x="11" y="6" width="14" height="14" fill="none" />
        <line x1="18" y1="6" x2="18" y2="20" strokeWidth="1.6" />
        <line x1="11" y1="13" x2="25" y2="13" strokeWidth="1.6" />
        {/* ground line */}
        <line x1="-34" y1="34" x2="34" y2="34" />
        {/* sprig */}
        <path d="M 32 34 C 32 27, 36 24, 35 17" strokeWidth="1.6" />
        <path d="M 35 17 C 33 17, 31 15, 31 13" strokeWidth="1.4" />
        <path d="M 35 17 C 37 16, 38 14, 38 12" strokeWidth="1.4" />
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
