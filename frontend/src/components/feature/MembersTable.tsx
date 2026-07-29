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
    label: "ACTIVE",
    iconColor: "text-secondary",
  },
  frozen: {
    bg: "bg-primary-container/10",
    text: "text-primary-container",
    icon: PauseCircle,
    label: "FROZEN",
    iconColor: "text-primary-container",
  },
  cancelled: {
    bg: "bg-error/10",
    text: "text-error",
    icon: XCircle,
    label: "CANCELLED",
    iconColor: "text-error",
  },
};

function isPastDate(dateStr: string): boolean {
  const parsed = new Date(dateStr);
  return !Number.isNaN(parsed.getTime()) && parsed < new Date();
}

export default function MembersTable({
  members,
  onView,
  onEdit,
  onFreeze,
  loading = false,
  emptyMessage = "No members found matching your criteria.",
}: MembersTableProps) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant">
            Loading members...
          </td>
        </tr>
      </tbody>
    );
  }

  if (members.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-outline-variant/50">
      {members.map((member) => {
        const config = statusConfig[member.status];
        const Icon = config.icon;

        return (
          <tr key={member.id} className="hover:bg-surface-container-high transition-colors group">
            <td className="px-lg py-md">
              <div className="flex items-center gap-md">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant flex-shrink-0">
                  {member.avatar ? (
                    <img className="w-full h-full object-cover" src={member.avatar} alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-bold text-xs text-on-surface-variant">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-body-md text-body-md text-on-surface font-semibold">{member.name}</p>
                  <p className="font-data-mono text-data-mono text-outline text-[11px]">ID: {member.memberId}</p>
                </div>
              </div>
            </td>
            <td className="px-lg py-md">
              <p className="font-body-md text-body-md text-on-surface">{member.plan}</p>
            </td>
            <td className="px-lg py-md">
              <span className={`inline-flex items-center gap-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text} font-bold text-[10px]`}>
                <Icon className={`text-[12px] ${config.iconColor}`} />
                {config.label}
              </span>
            </td>
            <td className="px-lg py-md">
              <p className="font-data-mono text-data-mono text-on-surface-variant">{member.expiration}</p>
              {member.status === "cancelled" && isPastDate(member.expiration) && (
                <p className="font-data-mono text-data-mono text-error text-[11px] font-bold tracking-tight">EXPIRED</p>
              )}
            </td>
            <td className="px-lg py-md">
              <p className="font-data-mono text-data-mono text-on-surface-variant">{member.lastCheckin}</p>
            </td>
            <td className="px-lg py-md">
              <div className="flex items-center justify-end gap-sm">
                <button
                  onClick={() => onView(member.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                  aria-label="View member"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(member.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                  aria-label="Edit member"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onFreeze(member.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                  aria-label={member.status === "frozen" ? "Unfreeze member" : "Freeze member"}
                >
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
