import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "face";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm",
  secondary:
    "bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]",
  danger:
    "bg-[var(--accent-danger)] hover:bg-red-700 text-white shadow-sm",
  face:
    "bg-[var(--accent-face)] hover:bg-[var(--primary-hover)] text-white shadow-sm",
};

const sizes = {
  sm: "h-8 px-3 text-xs font-medium",
  md: "h-10 px-4 text-sm font-medium",
  lg: "h-12 px-6 text-sm font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
