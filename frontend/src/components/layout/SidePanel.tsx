import { useRef, useEffect, ReactNode } from "react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function SidePanel({
  open,
  onClose,
  title,
  children,
  size = "lg",
  onSubmit,
  submitLabel = "Guardar",
  submitDisabled = false,
  submitLoading = false,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        focusRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidepanel-title"
    >
      <div
        className={`${sizeStyles[size]} h-full bg-surface-container border-l border-outline-variant flex flex-col animate-slide-in-right`}
        onClick={(e) => e.stopPropagation()}
        ref={panelRef}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md shrink-0">
          <h2 id="sidepanel-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
            aria-label="Cerrar panel"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-lg" tabIndex={-1} ref={focusRef}>
          {children}
        </div>
        {onSubmit && (
          <div className="border-t border-outline-variant p-lg bg-surface-container-low shrink-0">
            <div className="flex justify-end gap-sm">
              <button
                onClick={onClose}
                className="px-md min-h-[44px] rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors font-body-sm"
              >
                Cancelar
              </button>
              <button
                onClick={onSubmit}
                disabled={submitDisabled || submitLoading}
                className="px-md min-h-[44px] rounded-lg bg-primary text-on-primary hover:scale-105 active:scale-95 transition-all font-body-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-sm"
              >
                {submitLoading && <span className="spinner" />}
                {submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}