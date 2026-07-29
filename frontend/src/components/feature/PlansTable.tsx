import type { MembershipPlan } from "../../types/api";

interface PlansTableProps {
  plans: MembershipPlan[];
  onDuplicate: (id: string) => void;
  onStatusToggle: (id: string, status: boolean) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
  monthly: { label: "Mensual", bg: "bg-secondary/10", text: "text-secondary" },
  quarterly: { label: "Trimestral", bg: "bg-secondary/10", text: "text-secondary" },
  annual: { label: "Anual", bg: "bg-tertiary/10", text: "text-tertiary" },
  classes: { label: "Clases Sueltas", bg: "bg-secondary/10", text: "text-secondary" },
  daily: { label: "Pase Diario", bg: "bg-secondary/10", text: "text-secondary" },
  internal: { label: "Internal", bg: "bg-outline-variant/10", text: "text-on-surface-variant" },
};

export default function PlansTable({
  plans,
  onDuplicate,
  onStatusToggle,
  onRestore,
  onDelete,
}: PlansTableProps) {
  return (
    <section className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
      <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h3 className="font-headline-sm text-on-surface">Catálogo de Planes</h3>
        <div className="flex gap-md">
          <button className="px-md py-xs text-body-sm text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container-highest transition-colors">
            Exportar CSV
          </button>
          <button className="px-md py-xs text-body-sm text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container-highest transition-colors">
            Filtrar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-highest/30 border-b border-outline-variant">
              <th className="px-lg py-md font-label-caps text-label-caps text-on-surface border-b border-outline-variant">Plan</th>
              <th className="px-lg py-md font-label-caps text-label-caps text-on-surface border-b border-outline-variant">Tipo</th>
              <th className="px-lg py-md font-label-caps text-label-caps text-on-surface border-b border-outline-variant">Precio</th>
              <th className="px-lg py-md font-label-caps text-label-caps text-on-surface border-b border-outline-variant">Duración</th>
              <th className="px-lg py-md font-label-caps text-label-caps text-on-surface border-b border-outline-variant text-center">Público</th>
              <th className="px-lg py-md font-label-caps text-label-caps text-on-surface border-b border-outline-variant">Estado</th>
              <th className="px-lg py-md font-label-caps text-label-caps text-on-surface border-b border-outline-variant text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {plans.map((plan) => {
              return (
                <tr
                  key={plan.id}
                  className={`hover:bg-surface-container-highest/50 transition-colors cursor-pointer group ${
                    !plan.is_active ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-lg py-md">
                    <div className="font-body-md font-semibold text-on-surface">{plan.name}</div>
                    <div className="text-[11px] text-on-surface-variant">SKU: PL-{plan.id.slice(-4).toUpperCase()}</div>
                  </td>
                  <td className="px-lg py-md">
                    <span className={`px-sm py-1 ${typeConfig[plan.type]?.bg ?? typeConfig.internal.bg} ${typeConfig[plan.type]?.text ?? typeConfig.internal.text} font-label-caps rounded`}>
                      {typeConfig[plan.type]?.label ?? "Desconocido"}
                    </span>
                  </td>
                  <td className="px-lg py-md font-data-mono text-on-surface">
                    ${plan.price.toFixed(2)}{getPeriodLabel(plan.type)}
                  </td>
                  <td className="px-lg py-md font-body-sm text-on-surface-variant">
                    {plan.duration_days === -1 ? "Permanente" : `${plan.duration_days} Días`}
                  </td>
                  <td className="px-lg py-md text-center">
                    <div className="flex items-center justify-center gap-1">
                      {plan.type === "internal" ? (
                        <>
                          <span
                            className="material-symbols-outlined text-error text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            aria-hidden="true"
                          >
                            visibility_off
                          </span>
                          <span className="text-[10px] text-error font-medium">Interno</span>
                        </>
                      ) : (
                        <>
                          <span
                            className="material-symbols-outlined text-secondary text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            aria-hidden="true"
                          >
                            visibility
                          </span>
                          <span className="text-[10px] text-secondary font-medium">Sí</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-xs">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          plan.is_active ? "bg-secondary" : "bg-error"
                        }`}
                      ></div>
                      <span
                        className={`text-body-sm font-medium ${
                          plan.is_active ? "text-secondary" : "text-error"
                        }`}
                      >
                        {plan.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {!plan.is_active ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRestore(plan.id); }}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center hover:bg-secondary/10 rounded text-on-surface-variant hover:text-secondary transition-colors"
                            aria-label="Restaurar plan"
                          >
                            <span className="material-symbols-outlined text-sm">restore</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center hover:bg-error/10 rounded text-on-surface-variant hover:text-error transition-colors"
                            aria-label="Eliminar plan permanentemente"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onStatusToggle(plan.id, false); }}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center hover:bg-error/10 rounded text-on-surface-variant hover:text-error transition-colors"
                            aria-label="Desactivar plan"
                          >
                            <span className="material-symbols-outlined text-sm">block</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(plan.id); }}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-primary transition-colors"
                            aria-label="Duplicar plan"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getPeriodLabel(type: MembershipPlan["type"]): string {
  switch (type) {
    case "anual": return "/año";
    case "trimestral": return "/trim";
    case "mensual": return "/mes";
    case "internal": return "/permanent";
    default: return "/mes";
  }
}