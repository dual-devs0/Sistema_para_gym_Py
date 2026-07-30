import { AlertTriangle } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface ExpiringMember {
  id: string;
  name: string;
  initials: string;
  plan: string;
  planType: "premium" | "basic" | "student" | "other";
  expirationDate: string;
  daysUntilExpiry: number;
}

interface Props {
  members: ExpiringMember[];
  onRenew: (memberId: string) => void;
}

const planColors: Record<string, string> = {
  premium: "bg-[#c0c1ff1a] text-primary",
  basic: "bg-[#4ede3a1a] text-secondary",
  student: "bg-[#ffb95f1a] text-tertiary",
  other: "bg-surface-container-high text-on-surface-variant",
};

export default function ExpiringTable({ members, onRenew }: Props) {
  if (members.length === 0) {
    return (
      <Card title="Próximos a vencer">
        <p className="text-sm text-on-surface-variant">No hay membresías próximas a vencer.</p>
      </Card>
    );
  }

  return (
    <Card title="Próximos a vencer">
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest text-sm font-semibold text-on-surface-variant">
                {m.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{m.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColors[m.planType] || planColors.other}`}>
                    {m.plan}
                  </span>
                  {m.daysUntilExpiry <= 3 && (
                    <AlertTriangle size={14} className="text-tertiary" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-on-surface-variant">{m.expirationDate}</span>
              <Button variant="ghost" size="small" onClick={() => onRenew(m.id)}>
                Renovar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
