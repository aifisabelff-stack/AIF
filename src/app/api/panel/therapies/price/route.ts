import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { readRequestJson } from "@/lib/http-json";
import { updateOfferedTherapyPriceByName } from "@/lib/therapy-actions";

export async function POST(request: Request) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const body = await readRequestJson<{ name?: string; price?: number }>(request);
    const name = body?.name;
    const price = body?.price;
    if (!body || !name || price == null) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const result = await updateOfferedTherapyPriceByName(name, price);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/panel/therapies/price]", err);
    return NextResponse.json({ error: "No se pudo guardar el precio" }, { status: 500 });
  }
}
