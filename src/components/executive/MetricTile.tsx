import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number | null;
  deltaLabel?: string;
  higherIsBetter?: boolean;
  onClick?: () => void;
  accent?: "default" | "positive" | "warning" | "critical";
}

const accentRing: Record<string, string> = {
  default: "border-border",
  positive: "border-emerald-500/40",
  warning: "border-amber-500/50",
  critical: "border-destructive/50",
};

export function MetricTile({
  label,
  value,
  sub,
  delta,
  deltaLabel,
  higherIsBetter = true,
  onClick,
  accent = "default",
}: MetricTileProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta) && delta !== 0;
  const good = hasDelta ? (delta! > 0) === higherIsBetter : true;
  const Icon = !hasDelta ? ArrowRight : delta! > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group w-full rounded-xl border bg-card p-4 text-left transition-all",
        accentRing[accent],
        onClick ? "hover:border-primary/60 hover:shadow-md" : "cursor-default",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              good ? "text-emerald-600" : "text-destructive",
            )}
          >
            <Icon className="h-3 w-3" />
            {delta! > 0 ? "+" : ""}
            {Math.round(delta!)}
          </span>
        )}
        <span className="text-muted-foreground">{hasDelta ? deltaLabel : sub}</span>
      </div>
    </button>
  );
}

export default MetricTile;
