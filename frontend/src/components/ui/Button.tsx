import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "accent";
type Size = "sm" | "md" | "lg" | "small";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:scale-105 active:scale-95 focus:ring-primary",
  secondary: "bg-surface-container-highest text-on-surface hover:bg-surface-bright focus:ring-outline-variant",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-highest focus:ring-outline-variant",
  danger: "bg-error text-on-error hover:scale-105 active:scale-95 focus:ring-error",
  outline: "bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest focus:ring-outline-variant",
  // High-contrast CTA (gold) — reserved for the small set of headline actions
  // that move money/state forward: abrir turno, registrar ingreso, cobrar.
  accent: "bg-tertiary text-on-tertiary hover:scale-105 active:scale-95 focus:ring-tertiary",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-sm min-h-[36px] text-body-sm gap-1",
  md: "px-md min-h-[44px] text-body-sm gap-2",
  lg: "px-lg min-h-[52px] text-body-md gap-2",
  small: "px-2.5 py-1.5 text-xs",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, fullWidth = false, disabled, children, icon, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-body-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
        {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;