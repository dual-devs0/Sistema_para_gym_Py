import { ReactNode } from "react";

interface Props {
  label: string;
  value: number;
  prefix?: string;
  trend?: { value: number; direction: "up" | "down"; label: string };
  icon: ReactNode;
  iconColor: "primary" | "secondary" | "tertiary" | "error";
  variant?: "default" | "warning";
}

const iconBg: Record<string, string> = {
  primary: "bg-gray-100 text-gray-700",
  secondary: "bg-green-100 text-green-600",
  tertiary: "bg-blue-100 text-blue-600",
  error: "bg-red-100 text-red-600",
};

export default function StatCard({ label, value, prefix, trend, icon, iconColor, variant = "default" }: Props) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${
      variant === "warning" ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-white"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {prefix ?? ""}{typeof value === "number" ? value.toLocaleString("es") : value}
          </p>
        </div>
        <div className={`rounded-lg p-2 ${iconBg[iconColor]}`}>{icon}</div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.direction === "up" ? "text-green-600" : "text-red-600"}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
          </span>
          <span className="text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}