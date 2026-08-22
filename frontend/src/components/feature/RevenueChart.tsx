import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { formatPYG } from "../../utils";

interface RevenueChartProps {
  data: { day: string; revenue: number }[];
  title?: React.ReactNode;
  period: "7d" | "30d" | "1a";
  onPeriodChange: (period: "7d" | "30d" | "1a") => void;
}

const customTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].value !== undefined) {
    return (
      <div className="bg-surface-container-highest border border-outline-variant/30 p-2 rounded text-[11px] font-mono">
        <p className="text-on-surface-variant">{label}</p>
        <p className="text-primary font-bold">{formatPYG(Number(payload[0].value))}</p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data, title = "Ingresos (Últimos 30 Días)", period, onPeriodChange }: RevenueChartProps) {
  const chartData = useMemo(
    () => data.length > 0 ? data : Array.from({ length: period === "7d" ? 7 : period === "30d" ? 30 : 12 }, (_, i) => ({ day: `Day ${i + 1}`, revenue: 0 })),
    [data, period]
  );

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-lg h-80 flex flex-col">
      <div className="flex justify-between items-center mb-xl">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
        <div className="flex gap-xs">
          {(["7d", "30d", "1a"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
               className={`px-sm py-1 rounded text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                period === p
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright"
              }`}
            >
              {p === "1a" ? "1A" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 relative flex items-end gap-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--color-on-surface-variant)", fontSize: 10, fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              interval={period === "7d" ? 0 : period === "1a" ? Math.floor(chartData.length / 12) : 2}
            />
            <YAxis
              tick={{ fill: "var(--color-on-surface-variant)", fontSize: 10, fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₲${(value / 1000).toFixed(0)}k`}
              interval="preserveStartEnd"
            />
            <Tooltip content={customTooltip} />
            <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
