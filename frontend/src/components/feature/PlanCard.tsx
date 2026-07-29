type PlanType = "Mensual" | "Trimestral" | "Anual" | "Clases Sueltas" | "Pase Diario" | "Internal";

interface PlanCardProps {
  name: string;
  price: number;
  period: "/mes" | "/año" | "/trim";
  type: PlanType;
  duration: string;
  visits: string | number;
  activeMembers: number;
  autoRenew: boolean;
  recommended?: boolean;
  internal?: boolean;
  onEdit: () => void;
}

const typeConfig = {
  Mensual: { bg: "bg-secondary/10", text: "text-secondary" },
  Trimestral: { bg: "bg-tertiary/10", text: "text-tertiary" },
  Anual: { bg: "bg-tertiary/10", text: "text-tertiary" },
  "Clases Sueltas": { bg: "bg-secondary/10", text: "text-secondary" },
  "Pase Diario": { bg: "bg-secondary/10", text: "text-secondary" },
  Internal: { bg: "bg-outline-variant/10", text: "text-on-surface-variant" },
} as const;

export default function PlanCard({
  name,
  price,
  period,
  type,
  duration,
  visits,
  activeMembers,
  autoRenew,
  recommended = false,
  internal = false,
  onEdit,
}: PlanCardProps) {
  const config = typeConfig[type];

  return (
    <div
      className={`plan-card p-lg flex flex-col justify-between group ${recommended ? "recommended-card" : ""}`}
      onClick={onEdit}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${name} plan`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-md py-xs rounded-full shadow-lg z-10">
          <span className="text-[10px] font-bold text-on-primary uppercase tracking-widest">
            Recomendado
          </span>
        </div>
      )}

      <div>
        <div className="flex justify-between items-start mb-md">
          <span
            className={`px-sm py-[2px] ${config.bg} ${config.text} text-[11px] font-bold rounded-full uppercase tracking-wider`}
          >
            {type}
          </span>
          <span className="flex items-center gap-1">
            <span className={`material-symbols-outlined text-sm ${internal ? "text-error" : "text-on-surface-variant"}`}
              style={internal ? { fontVariationSettings: "'FILL' 1" } : {}}
              aria-hidden="true"
            >
              {internal ? "visibility_off" : "visibility"}
            </span>
            <span className={`text-[10px] font-medium ${internal ? "text-error" : "text-on-surface-variant"}`}>
              {internal ? "Interno" : "Visible"}
            </span>
          </span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{name}</h3>
        <div className="flex items-baseline gap-xs mb-md">
          <span className="font-data-mono text-headline-lg text-primary">{price}</span>
          <span className="font-body-sm text-on-surface-variant">{period}</span>
        </div>
        <ul className="space-y-sm mb-lg">
          <li className="flex items-center gap-sm text-on-surface-variant text-body-sm">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">event</span>
            <span>{duration}</span>
          </li>
          <li className="flex items-center gap-sm text-on-surface-variant text-body-sm">
            {typeof visits === "number" || !isNaN(Number(visits)) ? (
              <>
                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                  fitness_center
                </span>
                <span>{visits} Visitas máx.</span>
              </>
            ) : (
              <>
                <span className="w-4 h-4 text-primary flex items-center justify-center text-xs">
                  ∞
                </span>
                <span>{visits}</span>
              </>
            )}
          </li>
        </ul>
      </div>

      <div className="pt-md border-t border-outline-variant/30 flex justify-between items-center">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">group</span>
          <span className="font-data-mono text-body-sm font-bold" aria-label={`${activeMembers} miembros activos`}>{activeMembers}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`material-symbols-outlined text-sm ${autoRenew ? "text-primary" : "text-on-surface-variant"}`}
            style={autoRenew ? { fontVariationSettings: "'FILL' 1" } : {}}
            aria-label={autoRenew ? "Renovación automática" : "Renovación manual"}
          >
            sync
          </span>
          <span className={`text-[10px] ${autoRenew ? "text-primary font-medium" : "text-on-surface-variant"}`}>
            {autoRenew ? "Auto" : "Manual"}
          </span>
        </div>
      </div>
    </div>
  );
}