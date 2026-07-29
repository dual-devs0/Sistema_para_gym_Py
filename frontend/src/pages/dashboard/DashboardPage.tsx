import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, CalendarCheck, AlertTriangle } from "lucide-react";
import StatCard from "../../components/feature/StatCard";
import RevenueChart from "../../components/feature/RevenueChart";
import MemberStatusDonut from "../../components/feature/MemberStatusDonut";
import ExpiringTable from "../../components/feature/ExpiringTable";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { DashboardSummary, DashboardRevenueResponse, DashboardExpiringResponse } from "../../types/api";

async function fetchSummary(): Promise<DashboardSummary> {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

async function fetchRevenue(): Promise<DashboardRevenueResponse> {
  const { data } = await api.get("/dashboard/revenue", { params: { period: "month" } });
  return data;
}

async function fetchExpiring(): Promise<DashboardExpiringResponse> {
  const { data } = await api.get("/dashboard/expiring");
  return data;
}

// Mock data for development when API is not available
const mockSummary: DashboardSummary = {
  revenue_today: 1240.00,
  revenue_month: 45890.00,
  active_members: 842,
  new_members_month: 23,
  checkins_today: 156,
  members_expiring_soon: 24,
};

const mockRevenue: DashboardRevenueResponse = {
  labels: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }),
  data: [840, 920, 1100, 1340, 1560, 1280, 1890, 2100, 2450, 2780, 3100, 3450, 3890, 4200, 4560, 4890, 5120, 5340, 5670, 5890, 6100, 6340, 6560, 6780, 7000, 7200, 7450, 7680, 7890, 8100],
};

const mockExpiring: DashboardExpiringResponse = {
  items: [
    { member_id: "1", member_name: "Juan Pérez", plan_name: "Premium Anual", plan_type: "premium", expiration_date: "24 Oct 2023", days_remaining: 2 },
    { member_id: "2", member_name: "María García", plan_name: "Básico Mensual", plan_type: "basic", expiration_date: "25 Oct 2023", days_remaining: 3 },
    { member_id: "3", member_name: "Ricardo Silva", plan_name: "Estudiantil", plan_type: "student", expiration_date: "25 Oct 2023", days_remaining: 3 },
    { member_id: "4", member_name: "Ana Martínez", plan_name: "Premium Anual", plan_type: "premium", expiration_date: "26 Oct 2023", days_remaining: 4 },
    { member_id: "5", member_name: "Carlos López", plan_name: "Básico Mensual", plan_type: "basic", expiration_date: "26 Oct 2023", days_remaining: 4 },
  ],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] || "Admin";
  const gymName = user?.gym?.name || "tu gimnasio";

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchSummary,
    staleTime: 5 * 60 * 1000,
    placeholderData: mockSummary,
  });

  const { data: revenue } = useQuery({
    queryKey: ["dashboard-revenue", "month"],
    queryFn: fetchRevenue,
    staleTime: 5 * 60 * 1000,
    placeholderData: mockRevenue,
  });

  const { data: expiring } = useQuery({
    queryKey: ["dashboard-expiring"],
    queryFn: fetchExpiring,
    staleTime: 2 * 60 * 1000,
    placeholderData: mockExpiring,
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
          total={summary?.active_members ?? 842}
          active={Math.round((summary?.active_members ?? 842) * 0.85)}
          frozen={Math.round((summary?.active_members ?? 842) * 0.1)}
          cancelled={Math.round((summary?.active_members ?? 842) * 0.05)}
        />
      </div>

      <ExpiringTable
        members={(expiring?.items ?? []).map((m) => ({
          id: m.member_id,
          name: m.member_name,
          initials: m.member_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          plan: m.plan_name,
          planType: m.plan_type as "premium" | "basic" | "student" | "other",
          expirationDate: m.expiration_date,
          daysUntilExpiry: m.days_remaining,
        }))}
        onRenew={handleRenew}
      />
    </>
  );
}
