import { ReactNode, useEffect, useCallback } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
}

// Arbitrary values on purpose: max-w-{sm,md,lg,xl} would resolve through
// Tailwind's `--spacing-*` theme keys (see index.css @theme), which this repo
// repurposes for gap-*/p-*/space-y-* (xs=4px ... xl=32px). Tailwind v4 prefers
// --spacing-* over --container-* for max-w-*, so those classes silently
// shrink to a few px. Bypass theme lookup entirely here.
const sizeStyles = {
  sm: "max-w-[28rem]",
  md: "max-w-[32rem]",
  lg: "max-w-[42rem]",
  xl: "max-w-[56rem]",
};

export default function Modal({ open, onClose, title, children, size = "md", closeOnOverlayClick = true }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`w-full ${sizeStyles[size]} rounded-xl bg-surface-container p-lg shadow-2xl animate-slide-up ${!closeOnOverlayClick ? "pointer-events-none" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-lg flex items-center justify-between border-b border-outline-variant pb-md">
            <h2 id="modal-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface text-xl leading-none p-1 rounded transition-colors"
              aria-label="Cerrar modal"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="scrollbar-thin max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}