import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import CheckInCard from "../../components/feature/CheckInCard";
import RecentCheckIns from "../../components/feature/RecentCheckIns";
import api from "../../services/api";

interface MemberData {
  id: string;
  name: string;
  initials: string;
  memberId: string;
  planName: string;
  status: "active" | "expiring" | "frozen" | "expired";
  visitsLeft: string | number;
  expiryLabel: string;
}

interface RecentEntry {
  id: string;
  name: string;
  initials: string;
  time: string;
  status: "verified" | "guest";
}

const mockMembers: MemberData[] = [
  { id: "1", name: "Marcos Aurelio", initials: "MA", memberId: "GP-8829-01", planName: "Premium Anual", status: "active", visitsLeft: "Ilimitado", expiryLabel: "12 Oct 2024" },
  { id: "2", name: "Sara Jiménez", initials: "SJ", memberId: "GP-7721-03", planName: "Básico Mensual", status: "active", visitsLeft: 8, expiryLabel: "28 Ago 2024" },
  { id: "3", name: "David Chen", initials: "DC", memberId: "GP-6612-05", planName: "Premium Anual", status: "expiring", visitsLeft: 3, expiryLabel: "2 días" },
  { id: "4", name: "Elena Rodríguez", initials: "ER", memberId: "GP-5543-07", planName: "Flex Trimestral", status: "active", visitsLeft: 22, expiryLabel: "15 Sep 2024" },
  { id: "5", name: "Tomás Herrera", initials: "TH", memberId: "GP-4432-09", planName: "Pase Estudiantil", status: "frozen", visitsLeft: 10, expiryLabel: "Congelado desde 15 Jul 2024" },
  { id: "6", name: "Maya Patel", initials: "MP", memberId: "GP-3321-11", planName: "Premium Anual", status: "active", visitsLeft: "Ilimitado", expiryLabel: "20 Nov 2024" },
  { id: "7", name: "Julián Vanegas", initials: "JV", memberId: "GP-2210-13", planName: "Básico Mensual", status: "expired", visitsLeft: 0, expiryLabel: "14 días vencido" },
  { id: "8", name: "Chris Evans", initials: "CE", memberId: "GP-1109-15", planName: "Flex Trimestral", status: "active", visitsLeft: 30, expiryLabel: "10 Oct 2024" },
];

const mockRecent: RecentEntry[] = [
  { id: "r1", name: "Sara Jiménez", initials: "SJ", time: "Ahora", status: "verified" },
  { id: "r2", name: "David Chen", initials: "DC", time: "Hace 2m", status: "verified" },
  { id: "r3", name: "Elena Rodríguez", initials: "ER", time: "Hace 5m", status: "guest" },
  { id: "r4", name: "Tomás Herrera", initials: "TH", time: "Hace 8m", status: "verified" },
  { id: "r5", name: "Maya Patel", initials: "MP", time: "Hace 12m", status: "verified" },
  { id: "r6", name: "Julián Vanegas", initials: "JV", time: "Hace 15m", status: "verified" },
  { id: "r7", name: "Chris Evans", initials: "CE", time: "Hace 18m", status: "verified" },
];

export default function AttendancePage() {
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentEntry[]>(mockRecent);
  const [checkinCount, setCheckinCount] = useState(0);
  const [searchHint, setSearchHint] = useState("Listo para buscar. Escaneá o empezá a escribir...");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const { data: todayData } = useQuery({
    queryKey: ["attendance-today"],
    queryFn: async () => {
      const { data } = await api.get("/attendance/today");
      return data as { total_checkins: number; active_now: number };
    },
    placeholderData: { total_checkins: 156, active_now: 42 },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (todayData?.total_checkins !== undefined) {
      setCheckinCount(todayData.total_checkins);
    }
  }, [todayData]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(searchTimeout.current);

    if (!value.trim()) {
      setSelectedMember(null);
      setSearchHint("Listo para buscar. Escaneá o empezá a escribir...");
      return;
    }

    setSearchHint("Buscando...");
    searchTimeout.current = setTimeout(() => {
      const q = value.toLowerCase().trim();
      const match = mockMembers.find(
        (m) => m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q)
      );
      if (match) {
        setSelectedMember(match);
        setSearchHint(`Encontrado: ${match.name}`);
      } else {
        setSelectedMember(null);
        setSearchHint("No se encontró el miembro. Probá con otro nombre.");
      }
    }, 200);
  }, []);

  const handleCheckIn = useCallback(() => {
    if (!selectedMember) return;
    setCheckinCount((c) => c + 1);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newEntry: RecentEntry = {
      id: `r${Date.now()}`,
      name: selectedMember.name,
      initials: selectedMember.initials,
      time: timeStr,
      status: "verified",
    };
    setRecentCheckIns((prev) => [newEntry, ...prev].slice(0, 15));
  }, [selectedMember]);

  const handleGoToPayments = useCallback(() => {
    window.location.href = "/payments";
  }, []);

  const sessionStart = new Date();
  sessionStart.setHours(8, 0, 0, 0);
  const sessionEnd = new Date();
  sessionEnd.setHours(9, 30, 0, 0);
  const sessionLabel = `Session: ${sessionStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${sessionEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="flex flex-col h-full">
      <section className="h-1/3 flex flex-col items-center justify-center gap-md">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-sm">
            <h1 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
              Control de Ingreso
            </h1>
            <div className="bg-surface-container-high px-3 py-1 rounded border border-outline-variant flex items-center gap-2 h-[44px]">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Ingresos hoy:</span>
              <span className="font-data-mono text-data-mono text-primary font-bold">{checkinCount}</span>
            </div>
          </div>
          <div className="relative bg-surface-container rounded-xl border border-outline-variant transition-all duration-300 focus-within:shadow-[0_0_0_2px_#c0c1ff,0_0_20px_rgba(192,193,255,0.15)]">
            <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-3xl pointer-events-none">search</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-transparent border-none py-6 pl-16 pr-md text-headline-sm font-headline-sm text-on-surface placeholder:text-outline focus:ring-0"
              placeholder="Buscar por nombre o escanear QR/huella"
              type="text"
              autoFocus
              aria-label="Buscar miembro por nombre o ID"
            />
            <div className="absolute right-md top-1/2 -translate-y-1/2 flex gap-sm pointer-events-none">
              <span className="material-symbols-outlined text-outline">fingerprint</span>
              <span className="material-symbols-outlined text-outline">camera_enhance</span>
            </div>
          </div>
          <p className="text-center mt-sm text-body-sm text-body-sm text-outline">{searchHint}</p>
        </div>
      </section>

      <section className="flex-1 flex gap-lg overflow-hidden pb-md min-h-0">
        <div className="w-1/2 flex flex-col gap-md overflow-y-auto custom-scrollbar pr-sm">
          {selectedMember ? (
            <CheckInCard
              key={`${selectedMember.id}-${selectedMember.status}`}
              name={selectedMember.name}
              initials={selectedMember.initials}
              memberId={selectedMember.memberId}
              planName={selectedMember.planName}
              status={selectedMember.status}
              visitsLeft={selectedMember.visitsLeft}
              expiryLabel={selectedMember.expiryLabel}
              onCheckIn={handleCheckIn}
              onGoToPayments={handleGoToPayments}
            />
          ) : (
            <div className="bg-surface-container border border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center h-full min-h-[300px]">
              <span className="material-symbols-outlined text-[64px] text-outline mb-md">person_search</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">Buscar un miembro</h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-sm">
                Escribí un nombre o escaneá un código QR para encontrar un miembro y registrar su ingreso.
              </p>
            </div>
          )}
        </div>

        <div className="w-1/2 flex flex-col gap-md min-h-0">
          <RecentCheckIns checkIns={recentCheckIns} sessionLabel={sessionLabel} />
        </div>
      </section>
    </div>
  );
}
