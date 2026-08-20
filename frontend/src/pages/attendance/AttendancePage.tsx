import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, LogOut, Calendar, SearchX } from "lucide-react";
import Button from "../../components/ui/Button";
import Pagination from "../../components/feature/Pagination";
import api from "../../services/api";
import type { AttendanceLog, AttendanceTodayResponse, Member } from "../../types/api";

const ITEMS_PER_PAGE = 15;

async function fetchAttendance(): Promise<AttendanceLog[]> {
  const { data } = await api.get("/attendance");
  return data;
}

async function fetchTodaySummary(): Promise<AttendanceTodayResponse> {
  const { data } = await api.get("/attendance/today");
  return data;
}

async function fetchMembers(): Promise<Member[]> {
  const { data } = await api.get("/members");
  return data;
}

function isToday(d: string) {
  const t = new Date(d);
  const n = new Date();
  return t.getDate() === n.getDate() && t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear();
}

function timeFmt(d: string) {
  return new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function dateFmt(d: string) {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short" });
}


function durationFmt(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return "—";
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AttendancePage() {
  const qc = useQueryClient();
  const { data: logs, isLoading } = useQuery({ queryKey: ["attendance"], queryFn: fetchAttendance });
  const { data: today } = useQuery({ queryKey: ["attendance-today"], queryFn: fetchTodaySummary });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });

  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const memberInputRef = useRef<HTMLDivElement>(null);

  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionError, setActionError] = useState("");

  function extractErrorMessage(err: unknown, fallback: string): string {
    const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    if (detail === "Member already checked in today") return "Este miembro ya tiene una entrada activa hoy.";
    if (detail === "Already checked out") return "Esta asistencia ya tiene salida registrada.";
    if (detail === "Member not found") return "Miembro no encontrado.";
    return detail || fallback;
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (memberInputRef.current && !memberInputRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const checkInMutation = useMutation({
    mutationFn: (memberId: string) => api.post("/attendance/check-in", null, { params: { member_id: memberId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-today"] });
      setSelectedMember(null);
      setMemberSearch("");
      setActionError("");
    },
    onError: (err: unknown) => {
      setActionError(extractErrorMessage(err, "No se pudo registrar la entrada. Intentá de nuevo."));
      setTimeout(() => setActionError(""), 5000);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (logId: string) => api.put(`/attendance/${logId}/check-out`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-today"] });
      setActionError("");
    },
    onError: (err: unknown) => {
      setActionError(extractErrorMessage(err, "No se pudo registrar la salida. Intentá de nuevo."));
      setTimeout(() => setActionError(""), 5000);
    },
  });

  const filtered = useMemo(() => {
    if (!logs) return [];
    let r = [...logs];
    const q = searchValue.toLowerCase();
    if (q) r = r.filter((l) => l.member_name?.toLowerCase().includes(q));
    if (dateFilter) r = r.filter((l) => new Date(l.check_in).toISOString().startsWith(dateFilter));
    return r;
  }, [logs, searchValue, dateFilter]);

  const memberSuggestions = useMemo(() => {
    if (!members || !memberSearch) return [];
    const q = memberSearch.toLowerCase();
    return members.filter((m) => {
      const name = `${m.first_name} ${m.last_name}`.toLowerCase();
      const doc = m.document_number?.toLowerCase() || "";
      return name.includes(q) || doc.includes(q);
    }).slice(0, 10);
  }, [members, memberSearch]);

  const activeCount = logs?.filter((l) => !l.check_out && isToday(l.check_in)).length || 0;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasActiveFilters = !!(searchValue || dateFilter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-up">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Asistencias</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {logs?.length || 0} registros
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Entradas hoy</p>
          <p className="text-3xl font-bold text-on-surface mt-1.5 tabular-nums">{today?.total_checkins ?? 0}</p>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Activos ahora</p>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-3xl font-bold text-secondary tabular-nums">{today?.active_now ?? 0}</p>
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-secondary font-medium px-2 py-0.5 rounded-full bg-secondary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                En vivo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-xl p-5 mb-6">
        <p className="text-sm font-semibold text-on-surface mb-3">Registrar entrada</p>
        {actionError && (
          <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2 mb-3">
            <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: "16px" }}>error</span>
            <p className="text-xs text-error">{actionError}</p>
          </div>
        )}
        <div className="flex items-end gap-3">
          <div className="relative flex-1" ref={memberInputRef}>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setSelectedMember(null);
                setShowMemberDropdown(true);
              }}
              onFocus={() => setShowMemberDropdown(true)}
              className="w-full bg-surface border border-outline-variant rounded-lg py-2.5 px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none transition-colors"
              placeholder="Buscar miembro por nombre o documento..."
            />
            {showMemberDropdown && memberSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-lg shadow-xl py-1 z-20 max-h-48 overflow-y-auto">
                {memberSuggestions.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberSearch(`${m.first_name} ${m.last_name}`);
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
          <Button
            onClick={() => selectedMember && checkInMutation.mutate(selectedMember.id)}
            disabled={!selectedMember}
            loading={checkInMutation.isPending}
            icon={<CheckCircle className="w-4 h-4" />}
          >
            Entrada
          </Button>
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
            placeholder="Buscar por nombre de miembro..."
          />
        </div>
        <div className="relative min-w-[180px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">calendar_today</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors [color-scheme:dark]"
            placeholder="Filtrar por fecha"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchValue(""); setDateFilter(""); setCurrentPage(1); }}
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
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Entrada</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Salida</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Duración</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Estado</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {paginated.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-higher/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
                          {log.member_name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-medium text-on-surface">{log.member_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface font-mono tabular-nums">
                      {timeFmt(log.check_in)}
                      <span className="text-[11px] text-on-surface-variant font-sans ml-1">{dateFmt(log.check_in)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface font-mono tabular-nums">
                      {log.check_out ? (
                        <>{timeFmt(log.check_out)} <span className="text-[11px] text-on-surface-variant font-sans ml-1">{dateFmt(log.check_out)}</span></>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant font-mono tabular-nums">
                      {durationFmt(log.check_in, log.check_out)}
                    </td>
                    <td className="px-6 py-4">
                      {!log.check_out ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                          <span className="text-xs font-medium text-secondary">Activo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-on-surface-variant/40" />
                          <span className="text-xs font-medium text-on-surface-variant">Completado</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!log.check_out && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkOutMutation.mutate(log.id)}
                          loading={checkOutMutation.isPending}
                          icon={<LogOut className="w-3.5 h-3.5" />}
                        >
                          Salida
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
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
              {hasActiveFilters ? <SearchX className="w-6 h-6 text-on-surface-variant" /> : <Calendar className="w-6 h-6 text-on-surface-variant" />}
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">
              {hasActiveFilters ? "Sin resultados" : "No hay asistencias registradas"}
            </p>
            <p className="text-xs text-on-surface-variant mb-4">
              {hasActiveFilters ? "Probá con otros filtros o limpiá la búsqueda." : "Usá el registro de entrada para la primera asistencia del día."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
