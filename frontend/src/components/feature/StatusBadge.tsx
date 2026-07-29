type Status = "active" | "frozen" | "cancelled";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const statusConfig = {
  active: {
    bg: "bg-secondary/10",
    color: "text-secondary",
    icon: "check_circle",
    label: "ACTIVO",
  },
  frozen: {
    bg: "bg-primary-container/10",
    color: "text-primary-container",
    icon: "pause_circle",
    label: "CONGELADO",
  },
  cancelled: {
    bg: "bg-error/10",
    color: "text-error",
    icon: "cancel",
    label: "CANCELADO",
  },
} as const;

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";
  const fontSize = size === "sm" ? "text-[10px]" : "text-label-caps";
  const iconSize = size === "sm" ? "text-[12px]" : "text-[14px]";

  return (
    <span className={`inline-flex items-center gap-xs ${padding} rounded-full ${config.bg} ${config.color} ${fontSize} font-bold`}>
      <span className={`material-symbols-outlined ${iconSize}`}>{config.icon}</span>
      {config.label}
    </span>
  );
}
