"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Label } from "@/components/ui/input";
import { readResponseJson } from "@/lib/http-json";

type Props = {
  redirectTo: string;
};

export function PanelAccessLoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/panel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await readResponseJson<{ error?: string }>(res);

      if (!res.ok || result?.error) {
        setError(result?.error ?? "Contraseña incorrecta");
        setLoading(false);
        return;
      }

      window.location.href = redirectTo;
    } catch {
      setLoading(false);
      setError("No se pudo conectar. Compruebe que la aplicación está en marcha.");
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gold-400/30 bg-cream-50 p-6 shadow-xl">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-gold-600" />
        <h1 className="font-display text-xl font-semibold text-iaf-900">
          Acceso al panel
        </h1>
      </div>
      <p className="mt-2 text-sm text-iaf-600">
        Introduzca la contraseña de gestión para continuar.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <FieldGroup>
          <Label htmlFor="panel-login-password">Contraseña</Label>
          <Input
            id="panel-login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            autoFocus
          />
        </FieldGroup>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading || !password}>
          {loading ? "Comprobando…" : "Entrar al panel"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => router.push("/")}
        >
          Cancelar
        </Button>
      </form>
    </div>
  );
}
