import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  icon: ReactNode;
  iconColor: "primary" | "secondary" | "tertiary" | "error";
  variant?: "default" | "warning";
}

const iconColors = {
  primary: "text-primary bg-surface-container-highest",
  secondary: "text-secondary bg-surface-container-highest",
  tertiary: "text-tertiary bg-surface-container-highest",
  error: "text-error bg-error-container/40",
} as const;

export default function StatCard({ label, value, prefix, trend, icon, iconColor, variant = "default" }: StatCardProps) {
  const isAlert = variant === "warning";

  return (
    <div className={`stat-card ${isAlert ? "border-error/30 hover:border-error" : ""}`}>
      <div className="flex justify-between items-start mb-md">
        <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
          {label}
        </span>
        <div className={`stat-icon-wrapper ${iconColors[iconColor]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-sm">
        <span className="font-display-lg text-[28px] leading-tight font-bold text-on-surface font-data-mono tabular-nums">
          {prefix ?? ""}{value}
        </span>
        {trend && (
          <span
            className={`font-body-sm text-body-sm flex items-center ${
              trend.direction === "up" ? "text-secondary" : trend.direction === "down" ? "text-error" : "text-on-surface-variant"
            }`}
          >
            {trend.value}%
            <span className="material-symbols-outlined text-sm ml-1">
              {trend.direction === "up" ? "trending_up" : trend.direction === "down" ? "trending_down" : "remove"}
            </span>
          </span>
        )}
      </div>
      {trend && trend.label && <p className="text-[11px] text-on-surface-variant mt-sm">{trend.label}</p>}
      {isAlert && <p className="text-[11px] text-error mt-sm font-bold tracking-tight">ACCIÓN REQUERIDA</p>}
    </div>
  );
}