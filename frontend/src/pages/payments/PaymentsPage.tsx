import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, DollarSign, RotateCcw, SearchX } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Pagination from "../../components/feature/Pagination";
import api from "../../services/api";
import type { Payment, Member } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import { canRefundPayments } from "../../utils/roles";

const ITEMS_PER_PAGE = 15;

async function fetchPayments(): Promise<Payment[]> {
  const { data } = await api.get("/payments");
  return data;
}

async function fetchMembers(): Promise<Member[]> {
  const { data } = await api.get("/members");
  return data;
}

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

const methodColors: Record<string, string> = {
  efectivo: "bg-secondary/10 text-secondary",
  tarjeta: "bg-tertiary/10 text-tertiary",
  transferencia: "bg-primary/10 text-primary",
  otro: "bg-surface-container-higher text-on-surface-variant",
};

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
  paid: { label: "Pagado", dot: "bg-secondary", text: "text-secondary" },
  refunded: { label: "Reembolsado", dot: "bg-error", text: "text-error" },
};

function dateFmt(d: string) {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

const emptyForm = { member_id: "", amount: "", payment_method: "efectivo", reference: "", notes: "" };

const methodOptions = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

export default function PaymentsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canRefund = canRefundPayments(user?.role);
  const { data: payments, isLoading } = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [formError, setFormError] = useState("");
  const memberInputRef = useRef<HTMLDivElement>(null);

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (memberInputRef.current && !memberInputRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const createMutation = useMutation({
    mutationFn: (body: { member_id: string; amount: number; payment_method: string; reference?: string; notes?: string }) =>
      api.post("/payments", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      setModalOpen(false);
      setForm(emptyForm);
      setMemberSearch("");
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(detail || "No se pudo registrar el pago. Intentá de nuevo.");
    },
  });

  const [refundError, setRefundError] = useState("");

  const refundMutation = useMutation({
    mutationFn: (paymentId: string) => api.put(`/payments/${paymentId}/refund`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      setRefundError("");
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setRefundError(detail || "No se pudo reembolsar el pago. Intentá de nuevo.");
      setTimeout(() => setRefundError(""), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.member_id) {
      setFormError("Seleccioná un miembro de la lista.");
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setFormError("Ingresá un monto válido.");
      return;
    }
    createMutation.mutate({
      member_id: form.member_id,
      amount: parseFloat(form.amount),
      payment_method: form.payment_method,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    });
  };

  const openCreate = () => {
    setForm(emptyForm);
    setMemberSearch("");
    setFormError("");
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    if (!payments) return [];
    let r = [...payments];
    const q = searchValue.toLowerCase();
    if (q) r = r.filter((p) => p.member_name?.toLowerCase().includes(q));
    if (statusFilter !== "all") r = r.filter((p) => p.status === statusFilter);
    return r;
  }, [payments, searchValue, statusFilter]);

  const totalRevenue = payments?.reduce((s, p) => p.status === "paid" ? s + p.amount : s, 0) || 0;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasActiveFilters = !!(searchValue || statusFilter !== "all");

  const memberSuggestions = useMemo(() => {
    if (!members || !memberSearch) return [];
    const q = memberSearch.toLowerCase();
    return members.filter((m) => {
      const name = `${m.first_name} ${m.last_name}`.toLowerCase();
      const doc = m.document_number?.toLowerCase() || "";
      return name.includes(q) || doc.includes(q);
    }).slice(0, 10);
  }, [members, memberSearch]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-up">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Pagos</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {payments?.length || 0} pagos registrados
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
          Registrar pago
        </Button>
      </div>

      {refundError && (
        <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2 mb-4">
          <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: "16px" }}>error</span>
          <p className="text-xs text-error">{refundError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Ingresos totales</p>
          <p className="text-3xl font-bold text-on-surface mt-1.5 tabular-nums">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Pagos completados</p>
          <p className="text-3xl font-bold text-secondary mt-1.5 tabular-nums">
            {payments?.filter((p) => p.status === "paid").length || 0}
          </p>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Reembolsos</p>
          <p className="text-3xl font-bold text-error mt-1.5 tabular-nums">
            {payments?.filter((p) => p.status === "refunded").length || 0}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">search</span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(1); }}
            className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none transition-colors"
            placeholder="Buscar por miembro..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="min-w-[140px] bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors"
        >
          <option value="all">Todos los estados</option>
          <option value="paid">Pagados</option>
          <option value="refunded">Reembolsados</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchValue(""); setStatusFilter("all"); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-higher border border-outline-variant transition-colors"
          >
            Restablecer filtros
          </button>
        )}
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Miembro</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Monto</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Método</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Referencia</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Estado</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Fecha</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {paginated.map((p) => {
                  const sc = statusConfig[p.status] || { label: p.status, dot: "bg-on-surface-variant/40", text: "text-on-surface-variant" };
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-higher/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
                            {p.member_name?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm font-medium text-on-surface">{p.member_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-on-surface tabular-nums">
                        ${p.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${methodColors[p.payment_method] || "bg-surface-container-higher text-on-surface-variant"}`}>
                          {methodLabels[p.payment_method] || p.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {p.reference || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                          <span className={`text-xs font-medium ${sc.text}`}>{sc.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {p.paid_at ? dateFmt(p.paid_at) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "paid" && canRefund && (
                            <button
                              onClick={() => refundMutation.mutate(p.id)}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                              title="Reembolsar"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {(p.status !== "paid" || !canRefund) && (
                            <span className="text-xs text-on-surface-variant">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-surface-container-higher flex items-center justify-center mb-4">
              {hasActiveFilters ? <SearchX className="w-6 h-6 text-on-surface-variant" /> : <DollarSign className="w-6 h-6 text-on-surface-variant" />}
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">
              {hasActiveFilters ? "Sin resultados" : "No hay pagos registrados todavía"}
            </p>
            <p className="text-xs text-on-surface-variant mb-4">
              {hasActiveFilters ? "Probá con otros filtros o limpiá la búsqueda." : "Registrá el primer pago para empezar."}
            </p>
            {!hasActiveFilters && (
              <Button variant="primary" size="sm" onClick={openCreate}>
                Registrar primer pago
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setMemberSearch(""); setFormError(""); }} title="Registrar pago" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={memberInputRef}>
            <label className="text-sm font-medium text-on-surface mb-1 block">Miembro</label>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setForm({ ...form, member_id: "" });
                setShowMemberDropdown(true);
              }}
              onFocus={() => setShowMemberDropdown(true)}
              className="w-full bg-surface border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none transition-colors"
              placeholder="Buscar miembro por nombre o documento..."
              required
            />
            {showMemberDropdown && memberSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-lg shadow-xl py-1 z-20 max-h-48 overflow-y-auto">
                {memberSuggestions.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearch(`${m.first_name} ${m.last_name}`);
                        setForm({ ...form, member_id: m.id });
                        setFormError("");
                        setShowMemberDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-on-surface hover:bg-surface-container-higher flex items-center gap-3 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
                        {m.first_name[0]}{m.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{m.first_name} {m.last_name}</p>
                        <p className="text-[11px] text-on-surface-variant">{m.document_number || m.email || ""}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {formError && (
            <p className="text-xs text-error font-medium">{formError}</p>
          )}
          <Input label="Monto ($)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface">Método de pago</label>
            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/50">
              {methodOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Input label="Referencia (opcional)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Input label="Notas (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setModalOpen(false); setMemberSearch(""); setFormError(""); }}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
