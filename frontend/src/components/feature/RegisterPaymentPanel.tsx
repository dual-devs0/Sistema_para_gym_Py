import { useState, useCallback } from "react";
import SidePanel from "../layout/SidePanel";

interface MemberOption {
  id: string;
  name: string;
  initials: string;
  planName: string;
  planPrice: number;
  dueDate: string;
}

interface RegisterPaymentPanelProps {
  open: boolean;
  onClose: () => void;
  members: MemberOption[];
  onRegister: (data: RegisterPaymentData) => Promise<void>;
}

export interface RegisterPaymentData {
  memberId: string;
  membershipPlan: string;
  amount: number;
  paymentMethod: "cash" | "card" | "transfer" | "qr";
  paymentDate: string;
  reference: string;
}

type PaymentMethod = "cash" | "card" | "transfer" | "qr";

const methodConfig: Record<PaymentMethod, { icon: string; label: string }> = {
  cash: { icon: "payments", label: "Efectivo" },
  card: { icon: "credit_card", label: "Tarjeta" },
  transfer: { icon: "account_balance", label: "Transfer." },
  qr: { icon: "qr_code_2", label: "QR/MP" },
};

const mockDefaultMember: MemberOption = {
  id: "1",
  name: "Marcus Aurelio",
  initials: "MA",
  planName: "Plan Básico Mensual",
  planPrice: 29.00,
  dueDate: "Vence 24 Oct",
};

export default function RegisterPaymentPanel({ open, onClose, members: _members, onRegister }: RegisterPaymentPanelProps) {
  const [selectedMember, setSelectedMember] = useState<MemberOption>(mockDefaultMember);
  const [memberSearch, setMemberSearch] = useState("Marcus Aurelio");
  const [plan, setPlan] = useState("Monthly Basic");
  const [amount, setAmount] = useState("29.00");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState("Today, Oct 24, 2023");
  const [reference, setReference] = useState("");
  const [amountError, setAmountError] = useState("");
  const [methodError, setMethodError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setAmountError("");
    setMethodError("");
    setSubmitting(false);
    setSuccess(false);
    setMemberSearch("Marcus Aurelio");
    setSelectedMember(mockDefaultMember);
    setPlan("Monthly Basic");
    setAmount("29.00");
    setMethod("cash");
    setDate("Today, Oct 24, 2023");
    setReference("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    let hasError = false;
    setAmountError("");
    setMethodError("");

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setAmountError("Ingrese un monto válido mayor a 0.");
      hasError = true;
    }
    if (!method) {
      setMethodError("Seleccione un método de pago.");
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    try {
      await onRegister({
        memberId: selectedMember.id,
        membershipPlan: plan,
        amount: amountNum,
        paymentMethod: method,
        paymentDate: date,
        reference,
      });
      setSuccess(true);
    } catch {
      setAmountError("Error al registrar el pago. Intente de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [amount, method, selectedMember, plan, date, reference, onRegister]);

  const handleStartAgain = useCallback(() => {
    resetForm();
  }, [resetForm]);

  return (
    <SidePanel
      open={open}
      onClose={handleClose}
      title="Registrar Pago"
      size="md"
      onSubmit={success ? undefined : handleSubmit}
      submitLabel={success ? undefined : "Registrar Pago"}
      submitDisabled={submitting || success}
      submitLoading={submitting}
    >
      <div className="space-y-xl">
        {success ? (
          <div className="space-y-lg">
            <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-lg p-md">
              <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="font-body-sm text-body-sm text-secondary">
                Pago registrado exitosamente para <strong>{selectedMember.name}</strong>.
              </p>
            </div>
            <div className="pt-lg border-t border-outline-variant">
              <div className="flex items-center justify-between text-body-sm mb-sm">
                <span className="text-on-surface-variant">Plan</span>
                <span className="text-on-surface font-semibold">{plan}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm mb-sm">
                <span className="text-on-surface-variant">Monto</span>
                <span className="font-data-mono text-primary font-bold">${amount}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface-variant">Método</span>
                <span className="flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-sm">{methodConfig[method].icon}</span>
                  {methodConfig[method].label}
                </span>
              </div>
            </div>
            <button
              onClick={handleStartAgain}
              className="w-full min-h-[52px] bg-primary text-on-primary rounded-lg font-bold font-body-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined">add</span>
              Registrar Otro Pago
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-sm">
              <label className="font-label-caps text-label-caps text-on-surface-variant">Selección de Miembro</label>
              <div className="relative mb-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">person_search</span>
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 min-h-[44px] text-body-md focus:border-primary focus:outline-none transition-colors"
                  placeholder="Buscar miembro..."
                  type="text"
                />
              </div>
              <div className="bg-surface-container-high border border-primary/20 rounded-xl p-md flex items-center gap-md">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                  {selectedMember.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body-md text-body-md font-bold text-on-surface truncate">{selectedMember.name}</div>
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm text-primary">verified</span>
                    <span className="text-body-sm text-body-sm text-on-surface-variant truncate">{selectedMember.planName}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-primary font-data-mono font-bold">${selectedMember.planPrice.toFixed(2)}</span>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">{selectedMember.dueDate}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-lg">
              <div className="space-y-sm">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Membresía/Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-3 min-h-[44px] text-body-md focus:border-primary focus:outline-none transition-colors appearance-none"
                >
                  <option>Básico Mensual</option>
                  <option>Pro Anual</option>
                  <option>Pase Diario</option>
                  <option>Paquete 10 Clases</option>
                </select>
              </div>
              <div className="space-y-sm">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-data-mono text-primary font-bold pointer-events-none">$</span>
                  <input
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setAmountError(""); }}
                    className={`w-full bg-surface border rounded-lg pl-7 pr-4 py-3 min-h-[44px] text-body-md font-data-mono font-bold text-primary focus:outline-none transition-colors ${
                      amountError ? "border-error" : "border-outline-variant focus:border-primary"
                    }`}
                    type="text"
                    inputMode="decimal"
                  />
                </div>
                {amountError && (
                  <p className="text-error text-body-sm text-body-sm mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {amountError}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-sm">
              <label className="font-label-caps text-label-caps text-on-surface-variant">Método de Pago</label>
              <div className="grid grid-cols-4 gap-sm">
                {(Object.entries(methodConfig) as [PaymentMethod, typeof methodConfig[PaymentMethod]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => { setMethod(key); setMethodError(""); }}
                    className={`flex flex-col items-center justify-center gap-xs py-3 min-h-[56px] rounded-lg border transition-all active:scale-95 touch-target ${
                      method === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant bg-surface text-on-surface-variant hover:border-outline"
                    }`}
                    aria-pressed={method === key}
                    aria-label={config.label}
                  >
                    <span className="material-symbols-outlined" style={method === key ? { fontVariationSettings: "'FILL' 1" } : {}}>{config.icon}</span>
                    <span className="text-[11px] font-bold uppercase">{config.label}</span>
                  </button>
                ))}
              </div>
              {methodError && (
                <p className="text-error text-body-sm text-body-sm mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {methodError}
                </p>
              )}
            </div>

            <div className="space-y-sm">
              <label className="font-label-caps text-label-caps text-on-surface-variant">Fecha de Pago</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">calendar_today</span>
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 min-h-[44px] text-body-md focus:border-primary focus:outline-none transition-colors"
                  type="text"
                />
              </div>
            </div>

            <div className="space-y-sm">
              <label className="font-label-caps text-label-caps text-on-surface-variant">
                Referencia / Nota <span className="text-outline font-normal normal-case">(Opcional)</span>
              </label>
              <textarea
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-body-md focus:border-primary focus:outline-none transition-colors resize-none min-h-[44px]"
                placeholder="Agregar referencia o nota..."
                rows={3}
              />
            </div>
          </>
        )}
      </div>
    </SidePanel>
  );
}
