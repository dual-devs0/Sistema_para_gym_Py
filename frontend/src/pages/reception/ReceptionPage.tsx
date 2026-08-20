import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LogOut } from "lucide-react";
import CheckInCard, { type MembershipStatus } from "../../components/feature/CheckInCard";
import api from "../../services/api";
import type { Member, MemberMembership, AttendanceLog } from "../../types/api";

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

function isToday(d: string) {
  const t = new Date(d);
  const n = new Date();
  return t.getDate() === n.getDate() && t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear();
}

export default function ReceptionPage() {
  const qc = useQueryClient();
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });
  const { data: attendance } = useQuery({ queryKey: ["attendance"], queryFn: fetchTodayAttendance });

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

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
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
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

      <div className="relative mb-6" ref={searchRef}>
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
          <ul className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-lg shadow-xl py-1 z-20 max-h-64 overflow-y-auto">
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
          <p className="text-xs text-error">{error}</p>
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
