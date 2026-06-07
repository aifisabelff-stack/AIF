"use client";

import { useState } from "react";
import { createInvoice } from "@/lib/finance-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

type PatientOption = { id: string; firstName: string; lastName: string };

type Line = { description: string; quantity: string; unitPrice: string };

export function InvoiceForm({ patients }: { patients: PatientOption[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);

  function addLine() {
    setLines([...lines, { description: "", quantity: "1", unitPrice: "" }]);
  }

  function removeLine(i: number) {
    if (lines.length > 1) setLines(lines.filter((_, idx) => idx !== i));
  }

  const subtotal = lines.reduce(
    (s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0),
    0
  );

  return (
    <Card title="Nueva factura" accent>
      <form action={createInvoice} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="patientId">Paciente *</Label>
            <Select id="patientId" name="patientId" required defaultValue="">
              <option value="" disabled>
                Seleccionar
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="status">Estado</Label>
            <Select id="status" name="status" defaultValue="ISSUED">
              <option value="DRAFT">Borrador</option>
              <option value="ISSUED">Emitida</option>
              <option value="PENDING_PAYMENT">Pendiente de pago</option>
              <option value="PAID">Pagada</option>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" name="date" type="date" defaultValue={today} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="dueDate">Vencimiento</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="taxRate">IVA (%)</Label>
            <Input id="taxRate" name="taxRate" type="number" defaultValue="21" min="0" max="100" />
          </FieldGroup>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-iaf-800">Líneas de factura</h3>
            <Button type="button" variant="secondary" onClick={addLine} className="text-xs">
              <Plus className="h-3.5 w-3.5" />
              Añadir línea
            </Button>
          </div>
          <div className="space-y-3">
            {lines.map((line, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-xl border border-iaf-100 bg-blush-50/30 p-4 sm:grid-cols-[1fr_80px_100px_auto]"
              >
                <input type="hidden" name="lineDescription" value={line.description} />
                <input type="hidden" name="lineQuantity" value={line.quantity} />
                <input type="hidden" name="lineUnitPrice" value={line.unitPrice} />
                <FieldGroup>
                  <Label>Concepto</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i].description = e.target.value;
                      setLines(next);
                    }}
                    required
                    placeholder="Tratamiento o producto"
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label>Cant.</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i].quantity = e.target.value;
                      setLines(next);
                    }}
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label>Precio €</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i].unitPrice = e.target.value;
                      setLines(next);
                    }}
                  />
                </FieldGroup>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-right font-display text-xl text-iaf-900">
            Subtotal estimado: {subtotal.toFixed(2)} €
          </p>
        </div>

        <FieldGroup>
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </FieldGroup>

        <Button type="submit">Crear factura</Button>
      </form>
    </Card>
  );
}
