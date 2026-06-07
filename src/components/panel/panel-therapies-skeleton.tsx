import { Card } from "@/components/ui/card";

export function PanelTherapiesSkeleton() {
  return (
    <Card title="Terapias disponibles" accent>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl border border-iaf-200/60 bg-iaf-50/50"
          />
        ))}
      </div>
    </Card>
  );
}
