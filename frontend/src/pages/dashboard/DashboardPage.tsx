import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, CalendarCheck, AlertTriangle } from "lucide-react";
import StatCard from "../../components/feature/StatCard";
import RevenueChart from "../../components/feature/RevenueChart";
import MemberStatusDonut from "../../components/feature/MemberStatusDonut";
import ExpiringTable from "../../components/feature/ExpiringTable";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { DashboardSummary, DashboardRevenueResponse, DashboardExpiringItem } from "../../types/api";

async function fetchSummary(): Promise<DashboardSummary> {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

async function fetchRevenue(): Promise<DashboardRevenueResponse> {
  const { data } = await api.get("/dashboard/revenue", { params: { days: 30 } });
  return data;
}

async function fetchExpiring(): Promise<DashboardExpiringItem[]> {
  const { data } = await api.get("/dashboard/expiring");
  return data;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] || "Admin";
  const gymName = user?.gym?.name || "tu gimnasio";

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchSummary,
    staleTime: 5 * 60 * 1000,
  });

  const { data: revenue } = useQuery({
    queryKey: ["dashboard-revenue", "month"],
    queryFn: fetchRevenue,
    staleTime: 5 * 60 * 1000,
  });

  const { data: expiring } = useQuery({
    queryKey: ["dashboard-expiring"],
    queryFn: fetchExpiring,
    staleTime: 2 * 60 * 1000,
  });

  const revenueChartData = revenue?.labels.map((label, i) => ({
    day: label,
    revenue: revenue.data[i],
  })) ?? [];

  const stats = [
    {
      key: "revenue_today",
      label: "Ingresos de Hoy",
      value: summary?.revenue_today ?? 0,
      prefix: "$",
      trend: { value: 12, direction: "up" as const, label: "vs. ayer" },
      icon: <DollarSign size={20} />,
      iconColor: "primary" as const,
    },
    {
      key: "active_members",
      label: "Miembros Activos",
      value: summary?.active_members ?? 0,
      trend: { value: 3, direction: "up" as const, label: "crecimiento este mes" },
      icon: <Users size={20} />,
      iconColor: "secondary" as const,
    },
    {
      key: "checkins_today",
      label: "Ingresos Hoy",
      value: summary?.checkins_today ?? 0,
      trend: { value: 2, direction: "down" as const, label: "vs. semana pasada" },
      icon: <CalendarCheck size={20} />,
      iconColor: "tertiary" as const,
    },
    {
      key: "expiring",
      label: "Por Vencer (3 días)",
      value: summary?.members_expiring_soon ?? 0,
      icon: <AlertTriangle size={20} />,
      iconColor: "error" as const,
      variant: "warning" as const,
    },
  ];

  const handleRenew = (memberId: string) => {
    console.log("Renew membership for:", memberId);
  };

  return (
    <>
      <div className="mb-xl">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Bienvenido de nuevo, {firstName}.
        </h1>
        <p className="text-on-surface-variant font-body-md text-body-md mt-unit">
          Esto es lo que está pasando en {gymName} hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
        {stats.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            prefix={stat.prefix}
            trend={stat.trend}
            icon={stat.icon}
            iconColor={stat.iconColor}
            variant={stat.variant}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-xl">
        <RevenueChart
          data={revenueChartData}
          title="Ingresos (Últimos 30 Días)"
          period="30d"
          onPeriodChange={(period) => console.log("Period changed:", period)}
        />
        <MemberStatusDonut
          total={summary?.active_members ?? 0}
          active={summary?.active_members ?? 0}
          frozen={0}
          cancelled={0}
        />
      </div>

      <ExpiringTable
        members={(expiring ?? []).map((m) => ({
          id: m.member_id,
          name: "",
          initials: "",
          plan: "",
          planType: "other" as const,
          expirationDate: new Date(m.end_date).toLocaleDateString("es-MX"),
          daysUntilExpiry: Math.ceil((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        }))}
        onRenew={handleRenew}
      />
    </>
  );
}
