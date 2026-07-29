import { useState, useCallback } from "react";
import RegisterPaymentPanel from "../../components/feature/RegisterPaymentPanel";

interface PaymentRecord {
  id: string;
  name: string;
  initials: string;
  plan: string;
  amount: number;
  method: string;
  methodIcon: string;
  methodColor: string;
  date: string;
  status: "paid" | "refunded";
}

const mockPayments: PaymentRecord[] = [
  { id: "1", name: "Marcos Aurelio", initials: "MA", plan: "Básico Mensual", amount: 29.00, method: "Efectivo", methodIcon: "payments", methodColor: "text-secondary", date: "24 Oct 2023", status: "paid" },
  { id: "2", name: "David Chen", initials: "DC", plan: "Premium Anual", amount: 299.00, method: "Tarjeta", methodIcon: "credit_card", methodColor: "text-tertiary", date: "22 Oct 2023", status: "paid" },
  { id: "3", name: "Elena Rodríguez", initials: "ER", plan: "Flex Trimestral", amount: 85.00, method: "Reembolsado", methodIcon: "reply", methodColor: "text-error", date: "20 Oct 2023", status: "refunded" },
  { id: "4", name: "Sara Jiménez", initials: "SJ", plan: "Pase Estudiantil", amount: 19.00, method: "Efectivo", methodIcon: "payments", methodColor: "text-secondary", date: "19 Oct 2023", status: "paid" },
  { id: "5", name: "Tomás Herrera", initials: "TH", plan: "Pase Diario", amount: 15.00, method: "QR/MP", methodIcon: "qr_code_2", methodColor: "text-primary", date: "18 Oct 2023", status: "paid" },
];

const mockMembers = [
  { id: "1", name: "Marcos Aurelio", initials: "MA", planName: "Plan Básico Mensual", planPrice: 29.00, dueDate: "Vence 24 Oct" },
  { id: "2", name: "David Chen", initials: "DC", planName: "Premium Anual", planPrice: 299.00, dueDate: "Vence 15 Nov" },
  { id: "3", name: "Sara Jiménez", initials: "SJ", planName: "Pase Estudiantil", planPrice: 19.00, dueDate: "Vence 28 Oct" },
];

export default function PaymentsPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>(mockPayments);

  const handleRegister = useCallback(async (data: { memberId: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const member = mockMembers.find((m) => m.id === data.memberId);
    if (!member) throw new Error("Member not found");
    const newPayment: PaymentRecord = {
      id: `p${Date.now()}`,
      name: member.name,
      initials: member.initials,
      plan: member.planName,
      amount: member.planPrice,
      method: "Cash",
      methodIcon: "payments",
      methodColor: "text-secondary",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "paid",
    };
    setPayments((prev) => [newPayment, ...prev]);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Pagos</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Historial de transacciones y registro de pagos</p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-sm px-lg min-h-[44px] bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          Registrar Pago
        </button>
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 bg-surface-container-lowest border-b border-outline-variant px-lg py-3 font-label-caps text-label-caps text-on-surface">
          <div className="col-span-2">Miembro</div>
          <div>Monto</div>
          <div>Método</div>
          <div className="text-right">Fecha</div>
        </div>
        <div className="divide-y divide-outline-variant">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className={`grid grid-cols-5 px-lg py-4 hover:bg-surface-container-high transition-colors items-center ${
                payment.status === "refunded" ? "opacity-60" : ""
              }`}
            >
              <div className="col-span-2 flex items-center gap-md">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  payment.status === "refunded" ? "bg-error/20 text-error" : "bg-primary/20 text-primary"
                }`}>
                  {payment.initials}
                </div>
                <div>
                  <div className="font-body-md text-body-md font-bold text-on-surface">{payment.name}</div>
                  <div className="text-on-surface-variant text-[12px]">{payment.plan}</div>
                </div>
              </div>
              <div className={`font-data-mono text-data-mono ${payment.status === "refunded" ? "text-error line-through" : "text-on-surface"}`}>
                ${payment.amount.toFixed(2)}
              </div>
              <div>
                <span className={`flex items-center gap-1 text-xs font-label-caps ${payment.methodColor}`}>
                  {payment.status === "refunded" ? (
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{payment.methodIcon}</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{payment.methodIcon}</span>
                  )}
                  {payment.method}
                </span>
              </div>
              <div className="text-right font-data-mono text-data-mono text-outline">{payment.date}</div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="px-lg py-xl text-center text-on-surface-variant font-body-sm">No hay pagos registrados.</div>
          )}
        </div>
      </div>

      <RegisterPaymentPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        members={mockMembers}
        onRegister={handleRegister}
      />
    </div>
  );
}
