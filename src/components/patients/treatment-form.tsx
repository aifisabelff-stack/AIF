import { createTreatment } from "@/lib/patient-actions";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Label, Textarea } from "@/components/ui/input";

export function TreatmentForm({ patientId }: { patientId: string }) {
  return (
    <form action={createTreatment} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input type="hidden" name="patientId" value={patientId} />
      <FieldGroup className="sm:col-span-2 lg:col-span-3">
        <Label htmlFor="name">Tratamiento *</Label>
        <Input id="name" name="name" required placeholder="Mesoterapia, peeling, etc." />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="area">Zona</Label>
        <Input id="area" name="area" placeholder="Rostro, cuello..." />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="price">Precio (€)</Label>
        <Input id="price" name="price" type="number" step="0.01" min="0" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="product">Producto</Label>
        <Input id="product" name="product" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="dosage">Dosis / volumen</Label>
        <Input id="dosage" name="dosage" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="nextSession">Próxima sesión</Label>
        <Input id="nextSession" name="nextSession" type="date" />
      </FieldGroup>
      <FieldGroup className="sm:col-span-2 lg:col-span-3">
        <Label htmlFor="notes">Notas del tratamiento</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </FieldGroup>
      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" variant="secondary">
          Añadir tratamiento
        </Button>
      </div>
    </form>
  );
}
