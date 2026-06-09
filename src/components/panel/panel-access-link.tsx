import { LogoMark } from "@/components/brand/logo";

/** Enlace HTML nativo al panel (navegación completa, sin depender del router cliente) */
export function PanelAccessLink() {
  return (
    <a
      href="/acceso?desde=/panel"
      className="group relative z-10 mx-auto inline-flex cursor-pointer flex-col items-center rounded-2xl transition-transform hover:scale-[1.02]"
      aria-label="Acceder al panel de gestión"
    >
      <LogoMark width={100} presentation="transparent" />
      <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600 transition-colors group-hover:text-gold-700">
        Panel de gestión
      </span>
    </a>
  );
}
