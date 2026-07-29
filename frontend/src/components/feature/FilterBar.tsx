import { useState, useRef, useEffect } from "react";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  planFilter: string;
  onPlanChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const statusOptions = [
  { value: "all", label: "Estado: Todos" },
  { value: "active", label: "Activo" },
  { value: "frozen", label: "Congelado" },
  { value: "cancelled", label: "Cancelado" },
];

const planOptions = [
  { value: "all", label: "Plan: Todos" },
  { value: "premium_annual", label: "Premium Anual" },
  { value: "monthly_basic", label: "Básico Mensual" },
  { value: "student_access", label: "Acceso Estudiante" },
];

export default function FilterBar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  planFilter,
  onPlanChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusOpen(false);
      }
      if (planRef.current && !planRef.current.contains(event.target as Node)) {
        setPlanOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-surface-container-low p-md border border-outline-variant rounded flex flex-col lg:flex-row gap-md items-stretch lg:items-center">
      <div className="flex-1 relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded py-2 pl-10 pr-4 text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 focus:outline-none text-body-sm transition-colors"
          placeholder="Buscar por nombre o ID..."
        />
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="relative min-w-[140px]" ref={statusRef}>
          <button
            type="button"
            onClick={() => setStatusOpen(!statusOpen)}
            className="appearance-none w-full bg-surface border border-outline-variant rounded py-2 pl-3 pr-10 text-on-surface text-body-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors flex items-center justify-between"
            aria-expanded={statusOpen}
            aria-haspopup="listbox"
          >
            <span>{statusOptions.find((o) => o.value === statusFilter)?.label || "Estado: Todos"}</span>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
              {statusOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {statusOpen && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-lg shadow-xl py-1 z-20 max-h-48 overflow-y-auto">
              {statusOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => {
                      onStatusChange(opt.value);
                      setStatusOpen(false);
                    }}
                    className={`w-full px-md py-sm text-left text-body-sm transition-colors ${
                      statusFilter === opt.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative min-w-[180px]" ref={planRef}>
          <button
            type="button"
            onClick={() => setPlanOpen(!planOpen)}
            className="appearance-none w-full bg-surface border border-outline-variant rounded py-2 pl-3 pr-10 text-on-surface text-body-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors flex items-center justify-between"
            aria-expanded={planOpen}
            aria-haspopup="listbox"
          >
            <span>{planOptions.find((o) => o.value === planFilter)?.label || "Plan: Todos"}</span>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
              {planOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {planOpen && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-lg shadow-xl py-1 z-20 max-h-48 overflow-y-auto">
              {planOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => {
                      onPlanChange(opt.value);
                      setPlanOpen(false);
                    }}
                    className={`w-full px-md py-sm text-left text-body-sm transition-colors ${
                      planFilter === opt.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="bg-surface-variant text-on-surface-variant hover:text-on-surface px-md py-2 border border-outline-variant rounded transition-colors text-body-sm"
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
}