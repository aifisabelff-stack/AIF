import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { searchPatients } from "@/lib/queries";
import { fullName, formatDate } from "@/lib/utils";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";
import { PatientSearch } from "@/components/patients/patient-search";
import { StatusBadge } from "@/components/patients/status-badge";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function PacientesPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const patients = await searchPatients(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-iaf-950">Clientes</h1>
          <p className="mt-1 text-sm text-iaf-600">
            {patients.length} {patients.length === 1 ? "registro" : "registros"}
            {q ? ` para «${q}»` : ""}
          </p>
        </div>
        <LinkButton href="/pacientes/nuevo">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </LinkButton>
      </div>

      <Suspense fallback={null}>
        <PatientSearch defaultQuery={q} />
      </Suspense>

      <Card className="overflow-hidden p-0">
        {patients.length === 0 ? (
          <p className="p-8 text-center text-sm text-iaf-500">
            No se encontraron clientes.{" "}
            <Link href="/pacientes/nuevo" className="font-medium text-iaf-800 underline">
              Registrar el primero
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-iaf-100 bg-iaf-50/80 text-iaf-600">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Contacto</th>
                  <th className="px-5 py-3 font-medium">Último tratamiento</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iaf-100">
                {patients.map((p) => {
                  const last = p.treatments[0];
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-iaf-50/50">
                      <td className="px-5 py-4">
                        <Link href={`/pacientes/${p.id}`} className="font-medium text-iaf-900 hover:underline">
                          {fullName(p.firstName, p.lastName)}
                        </Link>
                        {p.dni && <p className="text-xs text-iaf-500">{p.dni}</p>}
                      </td>
                      <td className="px-5 py-4 text-iaf-600">
                        <p>{p.phone ?? "—"}</p>
                        <p className="text-xs">{p.email ?? ""}</p>
                      </td>
                      <td className="px-5 py-4 text-iaf-600">
                        {last ? (
                          <>
                            <p>{last.name}</p>
                            <p className="text-xs text-iaf-400">{formatDate(last.date)}</p>
                          </>
                        ) : (
                          <span className="text-iaf-400">Sin tratamientos</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
