import { ReactNode } from "react";

interface Props {
  label: string;
  value: number | string;
  prefix?: string;
  trend?: { value: number; direction: "up" | "down"; label: string };
  icon: ReactNode;
  iconColor: "primary" | "secondary" | "tertiary" | "error";
  /** Set for values in guaraníes — renders with the monospace figure font. */
  mono?: boolean;
}

const iconBg: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  tertiary: "bg-tertiary/10 text-tertiary",
  error: "bg-error/10 text-error",
};

export default function StatCard({ label, value, prefix, trend, icon, iconColor, mono = false }: Props) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container p-5 transition-all duration-200 hover:scale-[1.03] hover:border-primary/30 active:scale-[0.97] cursor-pointer select-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">{label}</p>
          <p className={`mt-1 text-2xl font-bold text-on-surface tabular-nums ${mono ? "font-mono" : ""}`}>
            {prefix}{typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`rounded-lg p-2 ${iconBg[iconColor]}`}>{icon}</div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.direction === "up" ? "text-secondary font-semibold" : "text-error font-semibold"}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
          </span>
          <span className="text-on-surface-variant">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
