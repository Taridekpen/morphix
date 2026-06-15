interface AlertProps {
  variant?: "info" | "warning" | "success" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const styles = {
  info: "bg-[var(--primary-muted)] border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200",
  warning: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200",
  success: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200",
  error: "bg-[var(--error-bg)] border-red-200 dark:border-red-900 text-red-800 dark:text-red-200",
};

export function Alert({ variant = "info", title, children, className = "" }: AlertProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles[variant]} ${className}`}>
      {title && <p className="font-medium mb-1">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
