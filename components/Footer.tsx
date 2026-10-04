import { LogoV2 } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 text-center">
        <LogoV2 className="h-24 w-24" />
        <p className="handwritten mt-2 text-lg">thank you for shopping with us</p>
      </div>
    </footer>
  );
}
