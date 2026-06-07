import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  title,
  action,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-gold-400/20 bg-cream-50/90 shadow-sm backdrop-blur-sm",
        accent && "ring-1 ring-gold-400/25",
        className
      )}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-400/15 bg-gradient-to-r from-cream-100/80 to-transparent px-5 py-4">
          {title && (
            <h2 className="font-display text-lg font-semibold text-iaf-900">{title}</h2>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  variant?: "default" | "rose" | "gold" | "plum" | "lavender" | "coral";
}) {
  const accents = {
    default: "from-iaf-100 to-iaf-50 text-iaf-700",
    rose: "from-iaf-200/80 to-blush-100 text-iaf-700",
    gold: "from-gold-300/40 to-blush-100 text-gold-500",
    plum: "from-iaf-300/50 to-iaf-100 text-iaf-800",
    lavender: "from-cream-200 to-gold-200/50 text-gold-600",
    coral: "from-iaf-200/80 to-cream-100 text-iaf-600",
  };

  return (
    <div className="group rounded-2xl border border-iaf-200/60 bg-white/90 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-iaf-500">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-iaf-950">{value}</p>
          {sub && <p className="mt-1 text-xs text-iaf-500">{sub}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "rounded-xl bg-gradient-to-br p-2.5",
              accents[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
