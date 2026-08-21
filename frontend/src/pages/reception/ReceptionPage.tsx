import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LogOut, Wallet, Plus } from "lucide-react";
import CheckInCard, { type MembershipStatus } from "../../components/feature/CheckInCard";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import type { Member, MemberMembership, AttendanceLog, CashRegisterShift } from "../../types/api";
import { formatPYG } from "../../utils";

async function fetchMembers(): Promise<Member[]> {
  const { data } = await api.get("/members");
  return data;
}

async function fetchMemberships(memberId: string): Promise<MemberMembership[]> {
  const { data } = await api.get(`/members/${memberId}/memberships`);
  return data;
}

async function fetchTodayAttendance(): Promise<AttendanceLog[]> {
  const { data } = await api.get("/attendance");
  return data;
}

async function fetchCurrentShift(): Promise<CashRegisterShift | null> {
  const { data } = await api.get("/cash-register/current");
  return data;
}

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

function dateFmt(d: string) {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

function timeFmt(d: string) {
  return new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function isToday(d: string) {
  const t = new Date(d);
  const n = new Date();
  return t.getDate() === n.getDate() && t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear();
}

function CashShiftBanner() {
  const qc = useQueryClient();
  const { data: shift } = useQuery({ queryKey: ["cash-shift-current"], queryFn: fetchCurrentShift });

  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [withdrawFormOpen, setWithdrawFormOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMotivo, setWithdrawMotivo] = useState("");
  const [closedShift, setClosedShift] = useState<CashRegisterShift | null>(null);
  const [shiftError, setShiftError] = useState("");

  const openMutation = useMutation({
    mutationFn: (opening_amount: number) => api.post("/cash-register/open", { opening_amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-shift-current"] });
      setOpenModalOpen(false);
      setOpeningAmount("");
      setShiftError("");
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setShiftError(detail || "No se pudo abrir el turno.");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (body: { amount: number; motivo: string }) => api.post("/cash-register/withdrawals", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-shift-current"] });
      setWithdrawFormOpen(false);
      setWithdrawAmount("");
      setWithdrawMotivo("");
      setShiftError("");
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setShiftError(detail || "No se pudo registrar la salida.");
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => api.post("/cash-register/close"),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["cash-shift-current"] });
      setClosedShift(data);
      setShiftError("");
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setShiftError(detail || "No se pudo cerrar el turno.");
    },
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !withdrawMotivo.trim()) return;
    withdrawMutation.mutate({ amount, motivo: withdrawMotivo.trim() });
  };

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return;
    openMutation.mutate(amount);
  };

  return (
    <>
      <div className="max-w-[36rem] mb-6 bg-surface-container border border-outline-variant rounded-xl p-4">
        {shift ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <p className="text-sm font-medium text-on-surface">
                  Turno abierto desde las {timeFmt(shift.opened_at)} — Efectivo inicial{" "}
                  <span className="font-mono">{formatPYG(shift.opening_amount)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setWithdrawFormOpen((v) => !v); setShiftError(""); }}>
                  Registrar salida
                </Button>
                <Button variant="secondary" size="sm" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
                  Cerrar turno
                </Button>
              </div>
            </div>
            {shift.withdrawals.length > 0 && (
              <p className="text-xs text-on-surface-variant mt-2">
                {shift.withdrawals.length} salida(s) registrada(s) en este turno.
              </p>
            )}
            {shiftError && !withdrawFormOpen && (
              <p className="text-xs text-error font-medium mt-2">{shiftError}</p>
            )}
            {withdrawFormOpen && (
              <form onSubmit={handleWithdrawSubmit} className="mt-3 bg-surface-container-high rounded-lg p-3 space-y-2">
                {shiftError && <p className="text-xs text-error font-medium">{shiftError}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Monto (₲)"
                    className="w-full bg-surface border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={withdrawMotivo}
                    onChange={(e) => setWithdrawMotivo(e.target.value)}
                    placeholder="Motivo (obligatorio)"
                    className="w-full bg-surface border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setWithdrawFormOpen(false)}>Cancelar</Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={!withdrawAmount || !withdrawMotivo.trim()}
                    loading={withdrawMutation.isPending}
                  >
                    Guardar
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-on-surface-variant" />
              <p className="text-sm font-medium text-on-surface">Turno de caja cerrado</p>
            </div>
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setOpenModalOpen(true)}>
              Abrir turno
            </Button>
          </div>
        )}
      </div>

      <Modal open={openModalOpen} onClose={() => { setOpenModalOpen(false); setShiftError(""); }} title="Abrir turno de caja" size="sm">
        <form onSubmit={handleOpenSubmit} className="space-y-4">
          {shiftError && <p className="text-xs text-error font-medium">{shiftError}</p>}
          <Input
            label="Efectivo inicial (₲)"
            type="number"
            step="1"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpenModalOpen(false)}>Cancelar</Button>
            <Button variant="accent" type="submit" loading={openMutation.isPending}>Abrir turno</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!closedShift} onClose={() => setClosedShift(null)} title="Turno cerrado" size="sm">
        {closedShift && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">Efectivo</p>
                <p className="font-semibold text-on-surface font-mono">{formatPYG(closedShift.cash_total || 0)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">Tarjeta</p>
                <p className="font-semibold text-on-surface font-mono">{formatPYG(closedShift.card_total || 0)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">Transferencia</p>
                <p className="font-semibold text-on-surface font-mono">{formatPYG(closedShift.transfer_total || 0)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">Otro</p>
                <p className="font-semibold text-on-surface font-mono">{formatPYG(closedShift.other_total || 0)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">Salidas de dinero</p>
                <p className="font-semibold text-error font-mono">{formatPYG(closedShift.withdrawals_total || 0)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">Efectivo esperado</p>
                <p className="font-semibold text-secondary font-mono">{formatPYG(closedShift.expected_cash || 0)}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setClosedShift(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function ReceptionPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });
  const { data: attendance } = useQuery({ queryKey: ["attendance"], queryFn: fetchTodayAttendance });

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [error, setError] = useState("");
  const [debtBlocked, setDebtBlocked] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Shared by both "Ir a Pagos" entry points below (frozen/expired membership,
  // and the debt-block check-in error) so the navigation target lives in one place.
  const goToPaymentsFor = (memberId: string) => navigate(`/payments?member=${memberId}`);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const suggestions = useMemo(() => {
    if (!members || !search) return [];
    const q = search.toLowerCase();
    return members
      .filter((m) => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || m.document_number?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [members, search]);

  const { data: memberships } = useQuery({
    queryKey: ["member-memberships", selected?.id],
    queryFn: () => fetchMemberships(selected!.id),
    enabled: !!selected,
  });

  const activeLog = useMemo(() => {
    if (!selected || !attendance) return null;
    return attendance.find((l) => l.member_id === selected.id && !l.check_out && isToday(l.check_in)) || null;
  }, [selected, attendance]);

  const checkInMutation = useMutation({
    mutationFn: (memberId: string) => api.post("/attendance/check-in", null, { params: { member_id: memberId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      setError("");
      setDebtBlocked(false);
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      // "Saldo deudor..." is attendance_service's specific debt-limit message
      // (backend/app/services/attendance_service.py) — distinct from the other
      // 409 on this same endpoint ("Member already checked in today"), which
      // needs no "Ir a Pagos" CTA.
      setDebtBlocked(!!detail?.startsWith("Saldo deudor"));
      setError(detail === "Member already checked in today" ? "Este miembro ya tiene una entrada activa hoy." : detail || "No se pudo registrar el ingreso.");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (logId: string) => api.put(`/attendance/${logId}/check-out`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      setError("");
    },
    onError: () => setError("No se pudo registrar la salida."),
  });

  const selectMember = (m: Member) => {
    setSelected(m);
    setSearch(`${m.first_name} ${m.last_name}`);
    setShowDropdown(false);
    setError("");
    setDebtBlocked(false);
    checkInMutation.reset();
  };

  const latestMembership = useMemo(() => {
    if (!memberships || memberships.length === 0) return null;
    return [...memberships].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
  }, [memberships]);

  const membershipStatus: MembershipStatus = useMemo(() => {
    if (!selected) return "expired";
    if (selected.status === "frozen") return "frozen";
    if (!latestMembership || latestMembership.status === "cancelled") return "expired";
    const days = daysUntil(latestMembership.end_date);
    if (days < 0) return "expired";
    if (days <= 7) return "expiring";
    return "active";
  }, [selected, latestMembership]);

  return (
    <div>
      <div className="mb-6 animate-slide-in-up">
        <h1 className="text-2xl font-bold text-on-surface">Recepción</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Buscá un socio para registrar su ingreso o salida.</p>
      </div>

      <CashShiftBanner />

      <div className="relative mb-6 max-w-[36rem]" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar por nombre o documento..."
            className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 pl-10 pr-4 text-base text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none transition-colors"
            autoFocus
          />
        </div>
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-lg shadow-xl py-1 z-20 max-h-64 overflow-y-auto">
            {suggestions.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => selectMember(m)}
                  className="w-full px-4 py-2.5 text-sm text-left text-on-surface hover:bg-surface-container-higher flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
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

      {error && (
        <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2 mb-4 max-w-[36rem]">
          <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: "16px" }}>error</span>
          <p className="text-xs text-error flex-1">{error}</p>
          {debtBlocked && selected && (
            <button
              type="button"
              onClick={() => goToPaymentsFor(selected.id)}
              className="text-xs font-semibold text-error underline shrink-0"
            >
              Ir a Pagos
            </button>
          )}
        </div>
      )}

      {selected ? (
        <div className="max-w-[36rem]">
          <CheckInCard
            name={`${selected.first_name} ${selected.last_name}`}
            initials={`${selected.first_name[0]}${selected.last_name[0]}`}
            memberId={`#GP-${selected.id.slice(-4)}`}
            planName={latestMembership?.plan_name || "Sin plan asignado"}
            status={membershipStatus}
            visitsLeft={latestMembership?.remaining_visits ?? "Ilimitadas"}
            expiryLabel={latestMembership ? dateFmt(latestMembership.end_date) : "—"}
            checkedIn={!!activeLog || checkInMutation.isSuccess}
            checkInLoading={checkInMutation.isPending}
            onCheckIn={() => checkInMutation.mutate(selected.id)}
            onGoToPayments={() => goToPaymentsFor(selected.id)}
          />
          {activeLog && (
            <button
              onClick={() => checkOutMutation.mutate(activeLog.id)}
              disabled={checkOutMutation.isPending}
              className="w-full min-h-[52px] mt-3 bg-surface-container border border-outline-variant rounded-lg font-semibold text-on-surface flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              {checkOutMutation.isPending ? "Registrando salida..." : "Registrar salida"}
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-[36rem] flex flex-col items-center justify-center py-16 px-6 bg-surface-container border border-outline-variant rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-surface-container-higher flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-on-surface-variant" />
          </div>
          <p className="text-sm font-medium text-on-surface mb-1">Buscá un socio para empezar</p>
          <p className="text-xs text-on-surface-variant">Escribí su nombre o número de documento arriba.</p>
        </div>
      )}
    </div>
  );
}
