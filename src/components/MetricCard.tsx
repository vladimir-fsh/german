import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  caption: string;
};

export function MetricCard({ icon: Icon, label, value, caption }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink/60">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-ink">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss/10 text-moss">
          <Icon size={20} aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-sm text-ink/55">{caption}</p>
    </article>
  );
}
