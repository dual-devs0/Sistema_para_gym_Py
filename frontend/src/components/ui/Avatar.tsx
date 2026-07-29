import { AvatarProps } from "./Avatar.types";

export default function Avatar({ src, alt, initials, size = "md", className = "" }: AvatarProps) {
  const hasImage = src && src.trim() !== "";

  const sizeStyles = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div className={`rounded-full overflow-hidden bg-surface-container border border-outline-variant flex items-center justify-center ${sizeStyles[size]} ${className}`}>
      {hasImage ? (
        <img
          src={src}
          alt={alt || initials || "Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-bold text-on-surface-variant">
          {initials || "?"}
        </span>
      )}
    </div>
  );
}