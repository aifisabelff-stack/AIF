import { getOfferedTherapies } from "@/lib/queries";
import { AvailableTherapies } from "@/components/panel/available-therapies";

export async function PanelTherapiesSection() {
  const therapies = await getOfferedTherapies();
  return <AvailableTherapies therapies={therapies} />;
}
