import { ReactNode, useState, useRef, useEffect } from "react";

interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
}

interface ActionMenuProps {
  actions: ActionItem[];
  children: ReactNode;
}

export default function ActionMenu({ actions, children }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Acciones"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[140px] bg-surface-container-high border border-outline-variant rounded-lg shadow-xl py-1 z-20 animate-fade-in"
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-sm px-md py-sm text-left text-body-sm transition-colors ${
                action.variant === "danger" ? "text-error hover:bg-error/10" : "text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {action.icon && <span className="material-symbols-outlined text-[18px] flex-shrink-0">{action.icon}</span>}
              <span className="flex-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}