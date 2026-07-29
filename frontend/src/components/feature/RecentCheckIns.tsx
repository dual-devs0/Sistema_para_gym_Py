interface CheckInEntry {
  id: string;
  name: string;
  initials: string;
  time: string;
  status?: "verified" | "guest";
}

interface RecentCheckInsProps {
  checkIns: CheckInEntry[];
  sessionLabel?: string;
}

export default function RecentCheckIns({ checkIns, sessionLabel }: RecentCheckInsProps) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl flex flex-col h-full overflow-hidden">
      <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
        <h3 className="font-label-caps text-label-caps text-on-surface">Ingresos Recientes</h3>
        {sessionLabel && (
          <span className="text-xs text-outline font-data-mono">{sessionLabel}</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {checkIns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center px-lg">
            <span className="material-symbols-outlined text-[40px] text-outline mb-md">empty_dashboard</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Sin ingresos hoy</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-container-high z-10">
              <tr className="border-b border-outline-variant">
                <th className="px-lg py-3 font-label-caps text-label-caps text-on-surface">Miembro</th>
                <th className="px-md py-3 font-label-caps text-label-caps text-on-surface">Estado</th>
                <th className="px-lg py-3 font-label-caps text-label-caps text-on-surface text-right">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {checkIns.map((entry, i) => (
                <tr
                  key={entry.id}
                  className="hover:bg-surface-container-high transition-all"
                  style={i === 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? { animation: "slide-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }
                    : {}}
                >
                  <td className="px-lg py-3">
                    <div className="flex items-center gap-md">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant flex-shrink-0 bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px] text-primary font-bold">{entry.initials}</span>
                      </div>
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-md py-3">
                    <span className={`flex items-center gap-1 text-xs font-label-caps ${entry.status === "guest" ? "text-primary" : "text-secondary"}`}>
                      <span className="material-symbols-outlined text-[16px]">{entry.status === "guest" ? "find_replace" : "check_circle"}</span>
                      {entry.status === "guest" ? "Invitado" : "Verificado"}
                    </span>
                  </td>
                  <td className="px-lg py-3 text-right font-data-mono text-data-mono text-outline text-xs whitespace-nowrap">{entry.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
