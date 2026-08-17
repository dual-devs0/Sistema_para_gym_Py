import { ReactNode } from "react";

interface Props {
  label: string;
  value: number | string;
  prefix?: string;
  trend?: { value: number; direction: "up" | "down"; label: string };
  icon: ReactNode;
  iconColor: "primary" | "secondary" | "tertiary" | "error";
}

const iconBg: Record<string, string> = {
  primary: "bg-[#c0c1ff1a] text-primary",
  secondary: "bg-[#4edea31a] text-secondary",
  tertiary: "bg-[#ffb95f1a] text-tertiary",
  error: "bg-[#ffb4ab1a] text-error",
};

export default function StatCard({ label, value, prefix, trend, icon, iconColor }: Props) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container p-5 transition-all duration-200 hover:scale-[1.03] hover:border-primary/30 active:scale-[0.97] cursor-pointer select-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">{label}</p>
          <p className="mt-1 text-2xl font-bold text-on-surface tabular-nums">
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
