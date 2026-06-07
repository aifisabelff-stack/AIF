"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Label } from "@/components/ui/input";
import { readResponseJson } from "@/lib/http-json";
import { cn } from "@/lib/utils";

type Props = {
  protectionActive: boolean;
};

export function PanelAccessSettings({ protectionActive }: Props) {
  const router = useRouter();
  const [activate, setActivate] = useState(protectionActive);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActivate(protectionActive);
  }, [protectionActive]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    let result: { error?: string; success?: boolean };
    try {
      const res = await fetch("/api/panel/access-config", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      result =
        (await readResponseJson<{ error?: string; success?: boolean }>(res)) ??
        (res.ok ? {} : { error: "No se pudo guardar" });
    } catch {
      result = { error: "No se pudo guardar" };
    }
    setLoading(false);

    if (!result || result.error) {
      setError(result?.error ?? "No se pudo guardar");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <Card title="Contraseña de acceso al panel" accent>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-gold-400/20 bg-cream-100/60 px-4 py-3 text-sm text-iaf-700">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
        <p>
          {protectionActive
            ? "La protección está activa. Desde la página principal se pedirá la contraseña para entrar al panel."
            : "Puede activar una contraseña. Desde entonces, el enlace «Panel de gestión» en la portada pedirá esa contraseña cada vez."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="enabled" value={activate ? "true" : "false"} />
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
            activate
              ? "border-gold-400/50 bg-gold-50/80"
              : "border-iaf-200/80 bg-white/60"
          )}
        >
          <input
            type="checkbox"
            checked={activate}
            onChange={(e) => {
              setActivate(e.target.checked);
              setSuccess(false);
            }}
            className="h-4 w-4 rounded border-iaf-300 text-gold-600 focus:ring-gold-400"
          />
          <span className="text-sm font-medium text-iaf-900">
            Activar contraseña de acceso al panel
          </span>
        </label>

        {activate && (
          <>
            <FieldGroup>
              <Label htmlFor="panel-new-password">
                {protectionActive ? "Nueva contraseña" : "Contraseña"} *
              </Label>
              <Input
                id="panel-new-password"
                name="password"
                type="password"
                minLength={4}
                required={activate}
                autoComplete="new-password"
                placeholder="Mínimo 4 caracteres"
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="panel-confirm-password">Confirmar contraseña *</Label>
              <Input
                id="panel-confirm-password"
                name="confirmPassword"
                type="password"
                minLength={4}
                required={activate}
                autoComplete="new-password"
              />
            </FieldGroup>
            <p className="flex items-center gap-1.5 text-xs text-iaf-500">
              <Lock className="h-3.5 w-3.5" />
              Guarde la contraseña en un lugar seguro. Si la olvida, desactive la protección
              editando la base de datos o contacte con soporte técnico.
            </p>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Configuración guardada correctamente.
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar configuración"}
        </Button>
      </form>
    </Card>
  );
}
