"use client";



import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import { X, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FieldGroup, Input, Label } from "@/components/ui/input";
import { readResponseJson } from "@/lib/http-json";



type Props = {

  open: boolean;

  onClose: () => void;

};



export function PanelAccessModal({ open, onClose }: Props) {

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    if (!open) return;

    const prev = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {

      document.body.style.overflow = prev;

    };

  }, [open]);



  useEffect(() => {

    if (open) {

      setPassword("");

      setError(null);

    }

  }, [open]);



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

      const result = await readResponseJson<{ error?: string; success?: boolean }>(res);

      setLoading(false);



      if (!res.ok || !result || result.error) {

        setError(result?.error ?? "Contraseña incorrecta");

        return;

      }



      onClose();

      window.location.href = "/panel";

    } catch {

      setLoading(false);

      setError("No se pudo conectar con el servidor. Compruebe que la aplicación está en marcha.");

    }

  }



  if (!open) return null;



  const panel = (
    <div
      className="relative z-10 w-full max-w-sm rounded-2xl border border-gold-400/30 bg-cream-50 p-6 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-access-title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >

        <div className="flex items-start justify-between gap-3">

          <div className="flex items-center gap-2">

            <Lock className="h-5 w-5 text-gold-600" />

            <h2

              id="panel-access-title"

              className="font-display text-lg font-semibold text-iaf-900"

            >

              Acceso al panel

            </h2>

          </div>

          <button

            type="button"

            onClick={onClose}

            className="rounded-lg p-1 text-iaf-500 hover:bg-cream-200"

          >

            <X className="h-5 w-5" />

          </button>

        </div>

        <p className="mt-2 text-sm text-iaf-600">

          Introduzca la contraseña de gestión para continuar.

        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">

          <FieldGroup>

            <Label htmlFor="panel-access-password">Contraseña</Label>

            <Input

              id="panel-access-password"

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

          <div className="flex gap-2">

            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>

              Cancelar

            </Button>

            <Button type="submit" className="flex-1" disabled={loading || !password}>

              {loading ? "Comprobando…" : "Entrar"}

            </Button>

          </div>

        </form>
    </div>
  );

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-iaf-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {panel}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

