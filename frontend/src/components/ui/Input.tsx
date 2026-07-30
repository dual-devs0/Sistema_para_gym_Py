import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, rightElement, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block mb-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg bg-surface border border-outline-variant transition-colors 
              ${error ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant focus:border-primary focus:ring-primary/20"}
              px-sm py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant min-h-[44px]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
              disabled:opacity-50 disabled:cursor-not-allowed
              ${rightElement ? "pr-11" : ""}
              ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-0 top-0 h-full flex items-center pr-3 z-10 pointer-events-none">
              <div className="pointer-events-auto flex items-center justify-center min-w-[40px] text-on-surface-variant hover:text-on-surface transition-colors">
                {rightElement}
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-[11px] text-error" role="alert">{error}</p>}
        {helperText && !error && <p className="mt-1 text-[11px] text-on-surface-variant">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
