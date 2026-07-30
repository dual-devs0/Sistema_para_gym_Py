import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, CalendarCheck, AlertTriangle } from "lucide-react";
import StatCard from "../../components/feature/StatCard";
import RevenueChart from "../../components/feature/RevenueChart";
import MemberStatusDonut from "../../components/feature/MemberStatusDonut";
import ExpiringTable from "../../components/feature/ExpiringTable";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { DashboardSummary, DashboardRevenueResponse, DashboardExpiringItem } from "../../types/api";

const DAYS_MAP: Record<string, number> = { "7d": 7, "30d": 30, "1a": 365 };

async function fetchSummary(): Promise<DashboardSummary> {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

async function fetchRevenue(days: number): Promise<DashboardRevenueResponse> {
  const { data } = await api.get("/dashboard/revenue", { params: { days } });
  return data;
}

async function fetchExpiring(): Promise<DashboardExpiringItem[]> {
  const { data } = await api.get("/dashboard/expiring");
  return data;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] || "Admin";

  const [revenuePeriod, setRevenuePeriod] = useState<"7d" | "30d" | "1a">("30d");

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchSummary,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: revenue } = useQuery({
    queryKey: ["dashboard-revenue", revenuePeriod],
    queryFn: () => fetchRevenue(DAYS_MAP[revenuePeriod]),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: expiring } = useQuery({
    queryKey: ["dashboard-expiring"],
    queryFn: fetchExpiring,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
      prefix: "₲",
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
      },
  ];

  const handleRenew = async (membershipId: string) => {
    try {
      await api.put(`/memberships/${membershipId}/renew`);
    } catch {
      // silently fail
    }
  };

  return (
    <>
      <div className="mb-xl animate-slide-in-up">
        <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
          Bienvenido de nuevo, {firstName}.
        </h1>
        <p className="text-on-surface-variant text-sm sm:text-base mt-1">
          Esto es lo que está pasando en GymPro hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-xl">
        {stats.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            prefix={stat.prefix}
            trend={stat.trend}
            icon={stat.icon}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-xl">
        <div className="lg:col-span-2">
          <RevenueChart
            data={revenueChartData}
            title={`Ingresos (Últimos ${DAYS_MAP[revenuePeriod]} Días)`}
            period={revenuePeriod}
            onPeriodChange={setRevenuePeriod}
          />
        </div>
        <MemberStatusDonut
          total={(summary?.active_members ?? 0) + (summary?.frozen_members ?? 0) + (summary?.cancelled_members ?? 0)}
          active={summary?.active_members ?? 0}
          frozen={summary?.frozen_members ?? 0}
          cancelled={summary?.cancelled_members ?? 0}
        />
      </div>

      <ExpiringTable
        members={(expiring ?? []).map((m) => {
          const daysUntilExpiry = Math.ceil((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const initials = (m.member_name || "??").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
          return {
            id: m.membership_id,
            name: m.member_name || "Sin nombre",
            initials,
            plan: m.plan_name || "Sin plan",
            planType: "other" as const,
            expirationDate: new Date(m.end_date).toLocaleDateString("es-MX"),
            daysUntilExpiry,
          };
        })}
        onRenew={handleRenew}
      />
    </>
  );
}
