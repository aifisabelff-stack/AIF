"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const barePrint = pathname?.includes("/imprimir");

  if (barePrint) {
    return <div className="relative isolate min-h-screen">{children}</div>;
  }

  return (
    <div className="relative isolate min-h-screen">
      <TopNav />
      <main className="relative z-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
