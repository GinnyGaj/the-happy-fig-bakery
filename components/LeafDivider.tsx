export function LeafDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-2" aria-hidden="true">
      <span className="h-px w-16 bg-border" />
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-secondary"
      >
        <path d="M14 3C9 6 6 11 6 16c0 4 3.5 7 8 7s8-3 8-7c0-5-3-10-8-13Z" />
        <path d="M14 3v20" />
        <path d="M14 10c-2 1-3.5 3-3.5 5" />
        <path d="M14 16c2 1 3.5 2.5 3.5 4" />
      </svg>
      <span className="h-px w-16 bg-border" />
    </div>
  );
}
