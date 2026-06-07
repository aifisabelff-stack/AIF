"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PatientSearch({ defaultQuery }: { defaultQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = (form.get("q") as string)?.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`/pacientes?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-iaf-400" />
      <Input
        name="q"
        placeholder="Buscar por nombre, DNI, teléfono..."
        defaultValue={defaultQuery}
        className="pl-9"
      />
    </form>
  );
}
