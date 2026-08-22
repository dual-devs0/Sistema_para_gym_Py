import type { MembershipPlan } from "../../types/api";
import { formatPYG } from "../../utils";

interface PlansTableProps {
  plans: MembershipPlan[];
  onDuplicate: (id: string) => void;
  onStatusToggle: (id: string, status: boolean) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (plan: MembershipPlan) => void;
  readOnly?: boolean;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  mensual: { label: "Mensual", color: "text-secondary" },
  trimestral: { label: "Trimestral", color: "text-secondary" },
  semestral: { label: "Semestral", color: "text-tertiary" },
  anual: { label: "Anual", color: "text-tertiary" },
  visitas: { label: "Por visitas", color: "text-on-surface-variant" },
};

export default function PlansTable({
  plans,
  onDuplicate,
  onStatusToggle,
  onRestore,
  onDelete,
  onEdit,
  readOnly = false,
}: PlansTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-outline-variant/30">
          <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Plan</th>
          <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Tipo</th>
          <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Precio</th>
          <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Duración</th>
          <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Visitas</th>
          <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Estado</th>
          <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/20">
        {plans.map((plan) => (
          <tr key={plan.id} className={`hover:bg-surface-container-higher/50 transition-colors group ${!plan.is_active ? "opacity-50" : ""}`}>
            <td className="px-6 py-4">
              <p className="text-sm font-semibold text-on-surface">{plan.name}</p>
              {plan.description && (
                <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">{plan.description}</p>
              )}
            </td>
            <td className="px-6 py-4">
              <span className={`text-sm capitalize ${typeConfig[plan.type]?.color || "text-on-surface-variant"}`}>
                {typeConfig[plan.type]?.label || plan.type}
              </span>
            </td>
            <td className="px-6 py-4 font-mono text-sm text-on-surface">
              {formatPYG(plan.price)}
              <span className="text-[11px] text-on-surface-variant font-sans ml-0.5">
                {plan.type === "anual" ? "/año" : plan.type === "trimestral" ? "/trim" : "/mes"}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-on-surface-variant">
              {plan.duration_days} días
            </td>
            <td className="px-6 py-4 text-sm text-on-surface-variant">
              {plan.max_visits ?? "Ilimitadas"}
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${plan.is_active ? "bg-secondary" : "bg-on-surface-variant"}`} />
                <span className={`text-xs font-medium ${plan.is_active ? "text-secondary" : "text-on-surface-variant"}`}>
                  {plan.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {readOnly ? (
                  <span className="text-xs text-on-surface-variant">—</span>
                ) : plan.is_active ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-higher hover:text-on-surface transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicate(plan.id); }}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-higher hover:text-secondary transition-colors"
                      title="Duplicar"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onStatusToggle(plan.id, false); }}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                      title="Desactivar"
                    >
                      <span className="material-symbols-outlined text-sm">block</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRestore(plan.id); }}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-secondary/10 hover:text-secondary transition-colors"
                      title="Restaurar"
                    >
                      <span className="material-symbols-outlined text-sm">restore</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
