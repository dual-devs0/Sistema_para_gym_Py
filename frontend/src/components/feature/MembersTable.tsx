import { CheckCircle, PauseCircle, XCircle, Eye, Edit, Snowflake } from "lucide-react";

interface Member {
  id: string;
  avatar?: string;
  name: string;
  memberId: string;
  plan: string;
  status: "active" | "frozen" | "cancelled";
  expiration: string;
  lastCheckin: string;
}

interface MembersTableProps {
  members: Member[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onFreeze: (id: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const statusConfig = {
  active: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    icon: CheckCircle,
    label: "Activo",
  },
  frozen: {
    bg: "bg-frozen/10",
    text: "text-frozen",
    icon: PauseCircle,
    label: "Congelado",
  },
  cancelled: {
    bg: "bg-error/10",
    text: "text-error",
    icon: XCircle,
    label: "Cancelado",
  },
};

export default function MembersTable({
  members, onView, onEdit, onFreeze, loading = false, emptyMessage = "No se encontraron miembros.",
}: MembersTableProps) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant">
            Cargando miembros...
          </td>
        </tr>
      </tbody>
    );
  }

  if (members.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-outline-variant/30">
      {members.map((member) => {
        const config = statusConfig[member.status];
        const Icon = config.icon;
        return (
          <tr key={member.id} className="group transition-colors hover:bg-surface-container-high">
            <td className="px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant/50 shrink-0">
                  {member.avatar ? (
                    <img className="w-full h-full object-cover" src={member.avatar} alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-bold text-on-surface-variant">
                        {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{member.name}</p>
                  <p className="text-[11px] text-outline font-mono">{member.memberId}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-3">
              <p className="text-sm text-on-surface">{member.plan}</p>
            </td>
            <td className="px-6 py-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.bg} ${config.text}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </span>
            </td>
            <td className="px-6 py-3">
              <p className="text-sm text-on-surface-variant font-mono">{member.expiration}</p>
              {member.status === "cancelled" && (
                <p className="text-[11px] font-bold text-error tracking-tight">VENCIDO</p>
              )}
            </td>
            <td className="px-6 py-3">
              <p className="text-sm text-on-surface-variant font-mono">{member.lastCheckin}</p>
            </td>
            <td className="px-6 py-3">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => onView(member.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" aria-label="Ver">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => onEdit(member.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" aria-label="Editar">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onFreeze(member.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" aria-label={member.status === "frozen" ? "Descongelar" : "Congelar"}>
                  <Snowflake className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
