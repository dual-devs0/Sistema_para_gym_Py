import { useState, useEffect, ReactNode } from "react";

interface MemberStatusDonutProps {
  total: number;
  active: number;
  frozen: number;
  cancelled: number;
  title?: ReactNode;
}

const segmentMeta = [
  { key: "active", label: "Activos", color: "var(--color-primary)", dotColor: "bg-primary" },
  { key: "frozen", label: "Congelados", color: "var(--color-frozen)", dotColor: "bg-frozen" },
  { key: "cancelled", label: "Cancelados", color: "var(--color-error)", dotColor: "bg-error" },
];

export default function MemberStatusDonut({ total, active, frozen, cancelled, title = "Estado de Miembros" }: MemberStatusDonutProps) {
  const [drawn, setDrawn] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 100);
    return () => clearTimeout(t);
  }, []);

  const circumference = 2 * Math.PI * 64;

  const segments = [
    { key: "active" as const, value: active, pct: total > 0 ? (active / total) * 100 : 0 },
    { key: "frozen" as const, value: frozen, pct: total > 0 ? (frozen / total) * 100 : 0 },
    { key: "cancelled" as const, value: cancelled, pct: total > 0 ? (cancelled / total) * 100 : 0 },
  ];

  let cumulativeOffset = 0;
  const segWithOffsets = segments.map((seg) => {
    const dash = (seg.pct / 100) * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += dash;
    return { ...seg, dash, offset };
  });

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-lg h-80 flex flex-col items-center justify-center">
      <h3 className="text-lg font-bold text-on-surface w-full text-left mb-xl">{title}</h3>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r="64" fill="none" stroke="var(--color-surface-container-highest)" strokeWidth="12" />
          {segWithOffsets.map((seg) =>
            seg.value > 0 && (
              <circle
                key={seg.key}
                cx="80" cy="80" r="64" fill="none"
                stroke={segmentMeta.find((m) => m.key === seg.key)?.color}
                strokeWidth="12"
                strokeDasharray={`${seg.dash} ${circumference}`}
                strokeDashoffset={drawn ? seg.offset : circumference}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ opacity: hovered === null || hovered === seg.key ? 1 : 0.2 }}
                onMouseEnter={() => setHovered(seg.key)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hovered ? (
            <>
              <span className="text-lg font-black tabular-nums text-on-surface">
                {segWithOffsets.find((s) => s.key === hovered)?.value}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">
                {segmentMeta.find((m) => m.key === hovered)?.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-black tabular-nums text-on-surface">{total}</span>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">Total Miembros</span>
            </>
          )}
        </div>
      </div>
      <div className="w-full mt-xl grid grid-cols-3 gap-xs">
        {segmentMeta.map((meta) => {
          const seg = segWithOffsets.find((s) => s.key === meta.key)!;
          return (
            <div
              key={meta.key}
              className="flex flex-col cursor-pointer transition-opacity duration-200"
              style={{ opacity: hovered === null || hovered === meta.key ? 1 : 0.3 }}
              onMouseEnter={() => setHovered(meta.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                <span className="text-[10px] text-on-surface-variant font-bold">{meta.label.toUpperCase()}</span>
              </div>
              <span className="text-sm font-bold tabular-nums text-on-surface">{seg.pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
