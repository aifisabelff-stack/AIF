"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/finance/expense-form";

export function ExpenseFormModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant="gold" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Registrar gasto
      </Button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-iaf-950/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            />
            <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold-400/30 bg-cream-50 shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold-400/20 bg-cream-50 px-6 py-4">
                <h2
                  id="expense-form-title"
                  className="font-display text-xl font-semibold text-iaf-900"
                >
                  Registrar gasto
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-iaf-600 hover:bg-cream-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-6">
                <ExpenseForm inModal />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
