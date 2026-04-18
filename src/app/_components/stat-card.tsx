import type { Icon } from "@phosphor-icons/react/dist/lib/types";

export function StatCard({
  icon: IconComp,
  label,
  value,
  sub,
}: {
  icon: Icon;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <IconComp size={14} weight="regular" />
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-medium tabular-nums">{value}</div>
      {sub && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
