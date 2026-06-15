import type { SessionStatus } from "@morphix/shared";

const configs: Record<string, { className: string; label: string }> = {
  live: { className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800", label: "Live" },
  connecting: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800", label: "Connecting" },
  applying: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800", label: "Applying" },
  error: { className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800", label: "Error" },
  "camera denied": { className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800", label: "Camera denied" },
  idle: { className: "bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)]", label: "Idle" },
};

export function StatusBadge({
  status,
  overlay = false,
}: {
  status: SessionStatus;
  overlay?: boolean;
}) {
  const cfg = configs[status] ?? configs.idle;
  const isLive = status === "live";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className} ${overlay ? "absolute top-3 left-3 backdrop-blur-sm shadow-sm" : ""}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${isLive ? "animate-[pulse-dot_1.5s_ease-in-out_infinite]" : "opacity-50"}`}
      />
      {cfg.label}
    </span>
  );
}

export function LiveIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-[var(--primary-muted)] text-[var(--primary)] border-indigo-200 dark:border-indigo-800"
          : "bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)]"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${active ? "bg-[var(--accent-success)] animate-[pulse-dot_1.5s_ease-in-out_infinite]" : "bg-[var(--border-strong)]"}`} />
      {label}
    </span>
  );
}
