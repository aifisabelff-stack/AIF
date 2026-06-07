import { NextResponse } from "next/server";
import { readRequestJson } from "@/lib/http-json";
import { verifyPanelAccessPassword } from "@/lib/panel-access-actions";

export async function POST(request: Request) {
  try {
    const body = await readRequestJson<{ password?: string }>(request);
    if (!body) {
      return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
    }
    const password = String(body.password ?? "");

    if (!password) {
      return NextResponse.json({ error: "Introduzca la contraseña" }, { status: 400 });
    }

    const result = await verifyPanelAccessPassword(password);

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[panel/login]", err);
    return NextResponse.json(
      { error: "No se pudo comprobar el acceso. Inténtelo de nuevo." },
      { status: 500 }
    );
  }
}
