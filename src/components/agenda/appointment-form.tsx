import { createAppointment } from "@/lib/appointment-actions";
import { DurationSelect } from "@/components/agenda/duration-select";
import { TherapySelect, type TherapyOption } from "@/components/agenda/therapy-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/input";

type PatientOption = { id: string; firstName: string; lastName: string };

export function AppointmentForm({
  patients,
  therapies,
}: {
  patients: PatientOption[];
  therapies: TherapyOption[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card title="Nueva cita" accent>
      <form action={createAppointment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="patientId">Paciente *</Label>
          <Select id="patientId" name="patientId" required defaultValue="">
            <option value="" disabled>
              Seleccionar paciente
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
          <Select id="status" name="status" defaultValue="SCHEDULED">
            <option value="SCHEDULED">Programada</option>
            <option value="CONFIRMED">Confirmada</option>
          </Select>
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <TherapySelect therapies={therapies} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="date">Fecha *</Label>
          <Input id="date" name="date" type="date" required defaultValue={today} />
          <p className="mt-1 text-xs text-iaf-500">
            Solo días laborables (lunes a viernes, excepto festivos).
          </p>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="startTime">Inicio *</Label>
          <Input id="startTime" name="startTime" type="time" required defaultValue="10:00" />
        </FieldGroup>
        <DurationSelect />
        <FieldGroup className="sm:col-span-2 lg:col-span-3">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" rows={2} placeholder="Preferencias, recordatorios..." />
        </FieldGroup>
        <div>
          <Button type="submit" disabled={therapies.length === 0}>
            Reservar cita
          </Button>
        </div>
      </form>
    </Card>
  );
}
