import { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
};

export default function Card({ title, children, className = "", padding = "lg" }: CardProps) {
  return (
    <div className={`bg-surface-container border border-outline-variant rounded-xl ${paddingStyles[padding]} ${className}`}>
      {title && <h3 className="mb-md font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h3>}
      {children}
    </div>
  );
}