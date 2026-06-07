import { createExpense } from "@/lib/finance-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/input";
import { EXPENSE_LABELS } from "@/lib/utils";

export function ExpenseForm({ inModal = false }: { inModal?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);

  const form = (
      <form action={createExpense} className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="date">Fecha *</Label>
          <Input id="date" name="date" type="date" required defaultValue={today} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="category">Categoría *</Label>
          <Select id="category" name="category" required defaultValue="SUMINISTROS">
            {Object.entries(EXPENSE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="description">Descripción *</Label>
          <Input id="description" name="description" required placeholder="Ej. Material desechable" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="amount">Importe (€) *</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </FieldGroup>
        <div>
          <Button type="submit">Guardar gasto</Button>
        </div>
      </form>
  );

  if (inModal) return form;

  return (
    <Card title="Registrar gasto" accent>
      {form}
    </Card>
  );
}
