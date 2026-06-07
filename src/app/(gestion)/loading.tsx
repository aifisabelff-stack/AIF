export default function GestionLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-16 rounded-xl bg-iaf-100/80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-iaf-100/70" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-iaf-100/60" />
    </div>
  );
}
