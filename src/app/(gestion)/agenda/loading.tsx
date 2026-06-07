export default function AgendaLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-cream-200" />
      <div className="h-[420px] rounded-2xl border border-gold-400/30 bg-cream-100" />
      <p className="text-center text-sm text-iaf-600">Cargando agenda...</p>
    </div>
  );
}
