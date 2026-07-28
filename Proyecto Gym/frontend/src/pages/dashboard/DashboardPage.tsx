import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, CalendarCheck, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import api from "../../services/api";
import type { DashboardSummary } from "../../types/api";

async function fetchSummary(): Promise<DashboardSummary> {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

async function fetchRevenueChart(): Promise<{ labels: string[]; data: number[] }> {
  const { data } = await api.get("/dashboard/revenue", { params: { period: "month" } });
  return data;
}

const stats = [
  { key: "revenue_today", label: "Ingresos hoy", icon: DollarSign, color: "text-green-600", bg: "bg-green-50", prefix: "$" },
  { key: "active_members", label: "Miembros activos", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "checkins_today", label: "Asistencias hoy", icon: CalendarCheck, color: "text-purple-600", bg: "bg-purple-50" },
  { key: "members_expiring_soon", label: "Próximos a vencer", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
];

export default function DashboardPage() {
  const { data: summary } = useQuery({ queryKey: ["dashboard-summary"], queryFn: fetchSummary });
  const { data: chart } = useQuery({ queryKey: ["dashboard-revenue"], queryFn: fetchRevenueChart });

  const chartData = chart?.labels.map((label, i) => ({ day: label, ingresos: chart.data[i] })) ?? [];

  return (
    <PageWrapper title="Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ key, label, icon: Icon, color, bg, prefix }) => (
          <Card key={key} className="flex items-center gap-4">
            <div className={`rounded-lg p-3 ${bg}`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {prefix ?? ""}{summary?.[key as keyof DashboardSummary] ?? 0}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card title="Ingresos del mes">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-10">Cargando gráfica...</p>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
