import { ReactNode } from "react";

interface ExpiringMember {
  id: string;
  name: string;
  initials: string;
  plan: string;
  planType: "premium" | "basic" | "student" | "other";
  expirationDate: string;
  daysUntilExpiry: number;
}

interface ExpiringTableProps {
  members: ExpiringMember[];
  onRenew: (memberId: string) => void;
  title?: ReactNode;
  showAllLink?: boolean;
}

const planStyles = {
  premium: "badge-primary",
  basic: "badge-secondary",
  student: "badge-tertiary",
  other: "badge-secondary",
} as const;

export default function ExpiringTable({ members, onRenew, title = "Próximos Vencimientos", showAllLink = true }: ExpiringTableProps) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden mb-lg">
      <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
        {showAllLink && <button className="text-primary hover:underline text-body-sm font-medium">Ver todo</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-highest">
              <th className="table-header">Miembro</th>
              <th className="table-header">Plan</th>
              <th className="table-header">Vencimiento</th>
              <th className="table-header text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {members.map((member) => (
              <tr key={member.id} className="table-row group">
                <td className="table-cell">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center font-bold text-xs border border-outline-variant">
                      {member.initials}
                    </div>
                    <span className="font-body-md text-body-md text-on-surface">{member.name}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`badge ${planStyles[member.planType]}`}>{member.plan}</span>
                </td>
                <td className="table-cell text-on-surface-variant font-data-mono text-body-sm">{member.expirationDate}</td>
                <td className="table-cell text-right">
                  <button
                    onClick={() => onRenew(member.id)}
                    className="btn-primary"
                    disabled={member.daysUntilExpiry < 0}
                  >
                    Renovar
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="table-cell text-center text-on-surface-variant py-xl">
                  No hay vencimientos próximos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}