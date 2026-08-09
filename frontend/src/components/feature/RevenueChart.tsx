import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { formatCurrency } from "../../utils";

interface RevenueChartProps {
  data: { day: string; revenue: number }[];
  title?: React.ReactNode;
  period: "7d" | "30d" | "90d";
  onPeriodChange: (period: "7d" | "30d" | "90d") => void;
  currency?: string;
}

const customTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length && payload[0].value !== undefined) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-2 text-xs shadow-md">
        <p className="text-gray-500">{label}</p>
        <p className="font-bold text-gray-900">{formatCurrency(payload[0].value, currency)}</p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data, title = "Ingresos (últimos 30 días)", period, onPeriodChange, currency }: RevenueChartProps) {
  const chartData = useMemo(
    () => data.length > 0 ? data : [],
    [data]
  );

  return (
    <div className="flex h-80 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                period === p ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} interval={period === "7d" ? 0 : 2} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip content={(props: any) => customTooltip({ ...props, currency })} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin datos de ingresos</div>
        )}
      </div>
    </div>
  );
}