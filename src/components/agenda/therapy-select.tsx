"use client";

import { FieldGroup, Label, Select } from "@/components/ui/input";
import { THERAPY_CATALOG, catalogDbNamesForGroup } from "@/lib/therapies";
import { formatCurrency } from "@/lib/utils";

export type TherapyOption = { id: string; name: string; price?: number | null };

type Props = {
  therapies: TherapyOption[];
  id?: string;
  name?: string;
  required?: boolean;
};

function optionLabel(t: TherapyOption) {
  if (t.price != null && t.price > 0) {
    return `${t.name} — ${formatCurrency(t.price)}`;
  }
  return t.name;
}

/** Terapias agrupadas por tratamiento para el desplegable */
function groupedTherapyOptions(therapies: TherapyOption[]) {
  const byName = new Map(therapies.map((t) => [t.name, t]));
  const used = new Set<string>();
  const groups: { label: string; options: TherapyOption[] }[] = [];

  for (const catalog of THERAPY_CATALOG) {
    const names = catalogDbNamesForGroup(catalog);
    const opts = names
      .map((n) => byName.get(n))
      .filter((t): t is TherapyOption => !!t);
    if (opts.length === 0) continue;
    opts.forEach((o) => used.add(o.name));
    groups.push({
      label: catalog.title,
      options: opts,
    });
  }

  const rest = therapies.filter((t) => !used.has(t.name));
  if (rest.length > 0) {
    groups.push({ label: "Otras", options: rest });
  }

  return groups;
}

export function TherapySelect({
  therapies,
  id = "therapyId",
  name = "therapyId",
  required = true,
}: Props) {
  const groups = groupedTherapyOptions(therapies);

  return (
    <FieldGroup>
      <Label htmlFor={id}>Terapia *</Label>
      <Select id={id} name={name} required={required} defaultValue="">
        <option value="" disabled>
          {therapies.length === 0
            ? "No hay terapias activas"
            : "Seleccionar terapia"}
        </option>
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name === "Valoración"
                  ? "Valoración"
                  : t.name.includes("— Sesión")
                    ? `Sesión — ${formatCurrency(t.price ?? 0)}`
                    : t.name.includes("Bono")
                      ? `Bono 3 sesiones — ${formatCurrency(t.price ?? 0)}`
                      : t.name.includes("valoración")
                        ? "Valoración previa"
                        : optionLabel(t)}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
    </FieldGroup>
  );
}
