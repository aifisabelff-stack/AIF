import { APPOINTMENT_DURATION_OPTIONS } from "@/lib/agenda-slots";
import { FieldGroup, Label, Select } from "@/components/ui/input";

type Props = {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export function DurationSelect({
  id = "durationMinutes",
  name = "durationMinutes",
  defaultValue = "30",
  value,
  onChange,
}: Props) {
  const controlled = value !== undefined;

  return (
    <FieldGroup>
      <Label htmlFor={id}>Duración *</Label>
      <Select
        id={id}
        name={name}
        required
        value={controlled ? value : undefined}
        defaultValue={controlled ? undefined : defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      >
        {APPOINTMENT_DURATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </FieldGroup>
  );
}
