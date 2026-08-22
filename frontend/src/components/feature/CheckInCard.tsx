import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

export type MembershipStatus = "active" | "expiring" | "frozen" | "expired";

interface CheckInCardProps {
  name: string;
  initials: string;
  memberId: string;
  planName: string;
  status: MembershipStatus;
  visitsLeft: string | number;
  expiryLabel: string;
  checkedIn?: boolean;
  checkInLoading?: boolean;
  onCheckIn: () => Promise<void> | void;
  onGoToPayments?: () => void;
}

const statusConfig: Record<MembershipStatus, { label: string; icon: string; bg: string; text: string; border: string }> = {
  active: { label: "Activo", icon: "check_circle", bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
  expiring: { label: "Por Vencer", icon: "schedule", bg: "bg-tertiary/10", text: "text-tertiary", border: "border-tertiary/20" },
  frozen: { label: "Congelado", icon: "pause_circle", bg: "bg-frozen/10", text: "text-frozen", border: "border-frozen/20" },
  expired: { label: "Vencido", icon: "cancel", bg: "bg-error/10", text: "text-error", border: "border-error/20" },
};

const isReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CheckInCard({
  name, initials, memberId, planName, status, visitsLeft, expiryLabel,
  checkedIn = false, checkInLoading = false, onCheckIn, onGoToPayments,
}: CheckInCardProps) {
  const [animating, setAnimating] = useState(false);
  const reduceMotion = isReducedMotion();
  const config = statusConfig[status];
  const canCheckIn = status === "active" || status === "expiring";

  // Only animate the "success pulse" once the check-in actually succeeded
  // (checkedIn flips true from the parent's mutation state) — never before,
  // so a failed request never shows a false "checked in" state.
  useEffect(() => {
    if (checkedIn && !reduceMotion) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 2000);
      return () => clearTimeout(t);
    }
  }, [checkedIn, reduceMotion]);

  const handleCheckIn = useCallback(() => {
    if (!canCheckIn || checkedIn || checkInLoading) return;
    onCheckIn();
  }, [canCheckIn, checkedIn, checkInLoading, onCheckIn]);

  const borderColor = status === "active" ? "border-primary" : status === "expiring" ? "border-tertiary" : status === "expired" ? "border-error" : "border-frozen";
  const opacityClass = status === "frozen" || status === "expired" ? "opacity-60" : "";

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-lg flex flex-col h-full">
      <div className={`flex items-center gap-lg border-b border-outline-variant pb-lg ${opacityClass}`}>
        <div className={`w-32 h-32 rounded-lg overflow-hidden border-2 ${borderColor} flex-shrink-0 bg-surface-container-high flex items-center justify-center`}>
          <span className={`text-3xl font-bold ${status === "expired" ? "text-error" : status === "frozen" ? "text-frozen" : "text-primary"}`}>{initials}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-md mb-xs flex-wrap">
            <h2 className="font-headline-lg text-headline-lg text-on-surface truncate">{name}</h2>
            <span className={`flex items-center gap-1 ${config.bg} ${config.text} px-2 py-0.5 rounded text-label-caps font-label-caps border ${config.border} shrink-0`}>
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{config.icon}</span>
              {config.label}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">stars</span>
            <span className="truncate">{planName}</span>
          </p>
          <p className="font-mono text-data-mono text-outline mt-sm">ID: {memberId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md py-lg flex-1">
        <div className="bg-surface-container-high p-md rounded border border-outline-variant flex flex-col justify-center items-center">
          <span className="font-label-caps text-label-caps text-outline mb-xs">Visitas Rest.</span>
          <span className={`font-headline-sm text-headline-sm ${status === "expiring" ? "text-tertiary" : status === "expired" ? "text-error" : "text-on-surface"}`}>
            {visitsLeft}
          </span>
        </div>
        <div className="bg-surface-container-high p-md rounded border border-outline-variant flex flex-col justify-center items-center">
          <span className="font-label-caps text-label-caps text-outline mb-xs">{status === "frozen" ? "Congelado Desde" : status === "expired" ? "Vencido" : "Próximo Venc."}</span>
          <span className={`font-headline-sm text-headline-sm ${status === "expiring" ? "text-tertiary" : status === "expired" ? "text-error" : "text-on-surface"}`}>
            {expiryLabel}
          </span>
        </div>
      </div>

      {(status === "expiring") && (
        <div className="flex items-center gap-2 bg-tertiary/10 border border-tertiary/20 rounded-lg p-md mb-sm">
          <span className="material-symbols-outlined text-tertiary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <p className="font-body-sm text-body-sm text-tertiary">Esta membresía vence pronto. El ingreso aún está permitido.</p>
        </div>
      )}

      {canCheckIn ? (
        <div className="relative">
          <button
            onClick={handleCheckIn}
            disabled={checkedIn || checkInLoading}
            className={`w-full min-h-[56px] rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-md transition-all touch-target ${
              checkedIn
                ? "bg-secondary text-on-secondary cursor-default"
                : "bg-tertiary text-on-tertiary hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
            } ${animating ? "animate-pulse-check" : ""}`}
            style={animating && !reduceMotion ? { animation: "pulse-check 0.5s ease-out" } : {}}
            aria-label={checkedIn ? "Ya registrado" : "Registrar ingreso"}
          >
            <span className="material-symbols-outlined">{checkedIn ? "check" : checkInLoading ? "hourglass_top" : "login"}</span>
            {checkedIn ? "¡Ingresado!" : checkInLoading ? "Registrando..." : "Registrar Ingreso"}
          </button>
          {animating && !reduceMotion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: [0, 1, 0], scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-primary"
            >
              <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          <div className={`flex items-center gap-2 rounded-lg p-md ${
            status === "frozen" ? "bg-frozen/10 border border-frozen/20" : "bg-error/10 border border-error/20"
          }`}>
            <span className={`material-symbols-outlined shrink-0 ${status === "frozen" ? "text-frozen" : "text-error"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            <p className={`font-body-sm text-body-sm ${status === "frozen" ? "text-on-surface-variant" : "text-error"}`}>
              {status === "frozen"
                ? "Esta membresía está congelada. No se permite el ingreso hasta reactivarla."
                : `Esta membresía venció. Debe adquirir un nuevo plan para continuar.`}
            </p>
          </div>
          <button
            disabled
            className="w-full min-h-[56px] bg-surface-container-highest text-on-surface-variant font-headline-sm rounded-lg flex items-center justify-center gap-md opacity-50 cursor-not-allowed touch-target"
            aria-label="Ingreso no disponible"
          >
            <span className="material-symbols-outlined">block</span>
            Ingreso No Disponible
          </button>
          {onGoToPayments && (
            <button
              onClick={onGoToPayments}
              className="w-full min-h-[56px] bg-primary/10 text-primary font-headline-sm rounded-lg hover:bg-primary/20 transition-all flex items-center justify-center gap-md active:scale-[0.97] touch-target border border-primary/20"
              aria-label="Ir a pagos"
            >
              <span className="material-symbols-outlined">payments</span>
              Ir a Pagos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
