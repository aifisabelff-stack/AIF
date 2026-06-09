"use server";

import { revalidatePath } from "next/cache";
import { ensureDefaultOfferedTherapies } from "@/lib/ensure-offered-therapies";
import {
  getTherapy,
  getTherapyByName,
  getTherapiesByNames,
  toggleTherapyActive,
  updateTherapy,
} from "@/lib/firestore-therapies";
import { catalogDbNamesForGroup, findCatalogGroupByKey } from "@/lib/therapies";
import { requirePanelSession } from "@/lib/panel-page-auth";

export { ensureDefaultOfferedTherapies };

export async function toggleOfferedTherapy(id: string) {
  await requirePanelSession();
  const therapy = await getTherapy(id);
  if (!therapy) {
    return { error: "Terapia no encontrada" };
  }

  await toggleTherapyActive(id, !therapy.active);

  revalidatePath("/panel");
  revalidatePath("/agenda");
  revalidatePath("/");

  return { active: !therapy.active };
}

export async function toggleOfferedTherapyGroup(groupKey: string) {
  await requirePanelSession();
  const group = findCatalogGroupByKey(groupKey);
  if (!group) return { error: "Terapia no encontrada" };

  const names = catalogDbNamesForGroup(group);
  const rows = await getTherapiesByNames(names);
  if (rows.length === 0) return { error: "Terapia no encontrada" };

  const activateAll = rows.some((r) => !r.active);
  await Promise.all(rows.map((therapy) => updateTherapy(therapy.id, { active: activateAll })));

  revalidatePath("/panel");
  revalidatePath("/agenda");
  revalidatePath("/");

  return { active: activateAll };
}

export async function updateOfferedTherapyPrice(id: string, price: number) {
  await requirePanelSession();
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Indique un precio válido (0 o mayor)" };
  }

  const therapy = await getTherapy(id);
  if (!therapy) {
    return { error: "Terapia no encontrada" };
  }

  await updateTherapy(id, { price });

  revalidatePath("/panel");
  revalidatePath("/agenda");
  revalidatePath("/");

  return { success: true as const };
}

export async function updateOfferedTherapyPriceByName(name: string, price: number) {
  await requirePanelSession();
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Indique un precio válido (0 o mayor)" };
  }

  const therapy = await getTherapyByName(name);
  if (!therapy) return { error: "Terapia no encontrada" };

  return updateOfferedTherapyPrice(therapy.id, price);
}
