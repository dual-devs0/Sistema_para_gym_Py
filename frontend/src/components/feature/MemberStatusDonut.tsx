import { ReactNode } from "react";

interface MemberStatusDonutProps {
  total: number;
  active: number;
  frozen: number;
  cancelled: number;
  title?: ReactNode;
}

export default function MemberStatusDonut({ total, active, frozen, cancelled, title = "Miembros por estado" }: MemberStatusDonutProps) {
  const activePct = total > 0 ? (active / total) * 100 : 0;
  const frozenPct = total > 0 ? (frozen / total) * 100 : 0;
  const cancelledPct = total > 0 ? (cancelled / total) * 100 : 0;

  const circumference = 2 * Math.PI * 64;
  const activeStroke = (activePct / 100) * circumference;
  const frozenStroke = (frozenPct / 100) * circumference;

  return (
    <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 w-full text-left text-lg font-semibold text-gray-900">{title}</h3>
      <div className="relative flex h-40 w-40 items-center justify-center">
        <svg className="h-full w-full -rotate-90">
          <circle cx="80" cy="80" r="64" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          {active > 0 && (
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="#2563eb"
              strokeWidth="12"
              strokeDasharray={`${activeStroke} ${circumference}`}
              strokeLinecap="round"
            />
          )}
          {frozen > 0 && (
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray={`${frozenStroke} ${circumference}`}
              strokeDashoffset={activeStroke}
              strokeLinecap="round"
            />
          )}
          {cancelled > 0 && (
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="#ef4444"
              strokeWidth="12"
              strokeDasharray={`${(cancelledPct / 100) * circumference} ${circumference}`}
              strokeDashoffset={activeStroke + frozenStroke}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{total}</span>
          <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400">Miembros</span>
        </div>
      </div>
      <div className="mt-4 grid w-full grid-cols-3 gap-2">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary-600" />
            <span className="text-[10px] font-bold text-gray-500">ACTIVOS</span>
          </div>
          <span className="text-sm text-gray-900">{activePct.toFixed(0)}%</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-gray-500">CONGELADOS</span>
          </div>
          <span className="text-sm text-gray-900">{frozenPct.toFixed(0)}%</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-gray-500">CANCELADOS</span>
          </div>
          <span className="text-sm text-gray-900">{cancelledPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}