"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  BarChart3,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";

const nav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/pacientes", label: "Clientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/facturacion", label: "Facturación", icon: Receipt },
  { href: "/gastos", label: "Gastos", icon: Wallet },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-gold-400/20 bg-cream-100/98 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:gap-6 sm:px-8 sm:py-3">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-90"
          aria-label="IAF - Inicio"
        >
          <LogoMark width={56} presentation="inline" priority />
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto sm:justify-center sm:gap-1"
          aria-label="Menú principal"
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : href === "/panel"
                  ? pathname === "/panel"
                  : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2 sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-sm",
                  active
                    ? "bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-md shadow-gold-400/20"
                    : "text-iaf-800 hover:bg-cream-200/80 hover:text-iaf-900"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
