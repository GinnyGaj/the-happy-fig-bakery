import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "sage",
  className,
}: {
  children: React.ReactNode;
  variant?: "sage" | "outline";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-medium",
        variant === "sage" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-primary text-primary",
        className
      )}
    >
      {children}
    </span>
  );
}
