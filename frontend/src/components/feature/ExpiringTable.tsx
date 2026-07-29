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
  premium: "bg-purple-100 text-purple-700",
  basic: "bg-blue-100 text-blue-700",
  student: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

export default function ExpiringTable({ members, onRenew }: Props) {
  if (members.length === 0) {
    return (
      <Card title="Próximos a vencer">
        <p className="text-sm text-gray-400">No hay membresías próximas a vencer.</p>
      </Card>
    );
  }

  return (
    <Card title="Próximos a vencer">
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                {m.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColors[m.planType] || planColors.other}`}>
                    {m.plan}
                  </span>
                  {m.daysUntilExpiry <= 3 && (
                    <AlertTriangle size={14} className="text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{m.expirationDate}</span>
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