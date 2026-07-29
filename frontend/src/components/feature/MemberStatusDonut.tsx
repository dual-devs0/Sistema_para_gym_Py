import { ReactNode } from "react";

interface MemberStatusDonutProps {
  total: number;
  active: number;
  frozen: number;
  cancelled: number;
  title?: ReactNode;
}

export default function MemberStatusDonut({ total, active, frozen, cancelled, title = "Member Status Breakdown" }: MemberStatusDonutProps) {
  const activePct = total > 0 ? (active / total) * 100 : 0;
  const frozenPct = total > 0 ? (frozen / total) * 100 : 0;
  const cancelledPct = total > 0 ? (cancelled / total) * 100 : 0;

  const circumference = 2 * Math.PI * 64;
  const activeStroke = (activePct / 100) * circumference;
  const frozenStroke = (frozenPct / 100) * circumference;

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-lg h-80 flex flex-col items-center justify-center">
      <h3 className="font-headline-sm text-headline-sm text-on-surface w-full text-left mb-xl">{title}</h3>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="64"
            fill="none"
            stroke="theme('colors.surface-container-highest')"
            strokeWidth="12"
          />
          {active > 0 && (
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="theme('colors.primary')"
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
              stroke="theme('colors.surface-container-highest')"
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
              stroke="theme('colors.error')"
              strokeWidth="12"
              strokeDasharray={`${(cancelledPct / 100) * circumference} ${circumference}`}
              strokeDashoffset={activeStroke + frozenStroke}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-headline-sm font-bold text-on-surface">{total}</span>
          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">Total Members</span>
        </div>
      </div>
      <div className="w-full mt-xl grid grid-cols-3 gap-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-[10px] text-on-surface-variant font-bold">ACTIVE</span>
          </div>
          <span className="font-data-mono text-body-sm text-on-surface">{activePct.toFixed(0)}%</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-surface-container-highest rounded-full" />
            <span className="text-[10px] text-on-surface-variant font-bold">FROZEN</span>
          </div>
          <span className="font-data-mono text-body-sm text-on-surface">{frozenPct.toFixed(0)}%</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-error rounded-full" />
            <span className="text-[10px] text-on-surface-variant font-bold">CANCELLED</span>
          </div>
          <span className="font-data-mono text-body-sm text-on-surface">{cancelledPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
