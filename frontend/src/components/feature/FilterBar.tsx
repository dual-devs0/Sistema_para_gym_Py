import { useState, useRef, useEffect } from "react";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  planFilter: string;
  onPlanChange: (value: string) => void;
  planOptions?: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activo" },
  { value: "frozen", label: "Congelado" },
  { value: "cancelled", label: "Cancelado" },
];

function Select({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative min-w-[160px]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface hover:border-primary/50 transition-colors"
      >
        <span className={value === "all" ? "text-on-surface-variant" : "text-on-surface"}>
          {options.find((o) => o.value === value)?.label || options[0].label}
        </span>
        <span className="material-symbols-outlined text-on-surface-variant text-lg">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-lg shadow-xl py-1 z-20 overflow-hidden">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                  value === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FilterBar(props: FilterBarProps) {
  const planOptions = [
    { value: "all", label: "Todos los planes" },
    ...(props.planOptions || []).map((name) => ({ value: name, label: name })),
  ];
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">search</span>
        <input
          type="text"
          value={props.searchValue}
          onChange={(e) => props.onSearchChange(e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none transition-colors"
          placeholder="Buscar por nombre o ID..."
        />
      </div>
      <Select options={statusOptions} value={props.statusFilter} onChange={props.onStatusChange} />
      <Select options={planOptions} value={props.planFilter} onChange={props.onPlanChange} />
      {props.hasActiveFilters && (
        <button onClick={props.onClearFilters} className="px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant transition-colors">
          Restablecer filtros
        </button>
      )}
    </div>
  );
}
