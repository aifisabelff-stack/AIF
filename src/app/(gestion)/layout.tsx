import { assertPanelPageAccess } from "@/lib/panel-page-auth";
import { GestionShell } from "./gestion-shell";

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  await assertPanelPageAccess();
  return <GestionShell>{children}</GestionShell>;
}
