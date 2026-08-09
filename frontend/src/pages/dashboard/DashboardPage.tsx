import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Users, CalendarCheck, AlertTriangle } from "lucide-react";
import StatCard from "../../components/feature/StatCard";
import RevenueChart from "../../components/feature/RevenueChart";
import MemberStatusDonut from "../../components/feature/MemberStatusDonut";
import ExpiringTable from "../../components/feature/ExpiringTable";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { currencySymbol } from "../../utils";
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
  const queryClient = useQueryClient();
  const firstName = user?.full_name?.split(" ")[0] || "Admin";
  const gymName = user?.gym?.name || "tu gimnasio";
  const currency = user?.gym?.currency || "PYG";

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

  const renewMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      await api.put(`/memberships/${membershipId}/renew`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-expiring"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
    },
  });

  const revenueChartData = revenue?.labels.map((label, i) => ({
    day: label,
    revenue: revenue.data[i],
  })) ?? [];

  const stats = [
    {
      key: "revenue_today",
      label: "Ingresos de hoy",
      value: summary?.revenue_today ?? 0,
      prefix: currencySymbol(currency),
      icon: <DollarSign size={20} />,
      iconColor: "primary" as const,
    },
    {
      key: "active_members",
      label: "Miembros activos",
      value: summary?.active_members ?? 0,
      icon: <Users size={20} />,
      iconColor: "secondary" as const,
    },
    {
      key: "checkins_today",
      label: "Asistencias hoy",
      value: summary?.checkins_today ?? 0,
      icon: <CalendarCheck size={20} />,
      iconColor: "tertiary" as const,
    },
    {
      key: "expiring",
      label: "Próximos a vencer (3 días)",
      value: summary?.members_expiring_soon ?? 0,
      icon: <AlertTriangle size={20} />,
      iconColor: "error" as const,
      variant: "warning" as const,
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hola de nuevo, {firstName}.</h1>
        <p className="mt-1 text-sm text-gray-500">Esto es lo que está pasando en {gymName} hoy.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            prefix={stat.prefix}
            icon={stat.icon}
            iconColor={stat.iconColor}
            variant={stat.variant}
          />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueChart
          data={revenueChartData}
          title="Ingresos (últimos 30 días)"
          period="30d"
          onPeriodChange={() => {}}
          currency={currency}
        />
        <MemberStatusDonut
          total={summary?.active_members ?? 0}
          active={summary?.active_members ?? 0}
          frozen={0}
          cancelled={0}
        />
      </div>

      <ExpiringTable
        members={(expiring ?? []).map((m) => {
          const initials = (m.member_name ?? "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
          return {
            id: m.membership_id,
            name: m.member_name ?? "—",
            initials,
            plan: m.plan_name ?? "—",
            planType: "other" as const,
            expirationDate: new Date(m.end_date).toLocaleDateString("es-MX"),
            daysUntilExpiry: Math.ceil((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          };
        })}
        onRenew={(membershipId) => renewMutation.mutate(membershipId)}
      />
    </>
  );
}