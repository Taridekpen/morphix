export function DecartCreditsBadge({
  balance,
  available,
  isLoading,
  isFetching,
  desktop,
}: {
  balance?: number | null;
  available?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  desktop?: boolean;
}) {
  const label = desktop ? "CREDITS" : "Decart credits";
  const showBalance = balance !== null && balance !== undefined;
  const display = isLoading
    ? "…"
    : showBalance
      ? balance.toLocaleString()
      : available === false
        ? "—"
        : "…";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        desktop
          ? "font-display tracking-wide bg-black/40 text-[var(--primary)] border-[var(--primary)]/40"
          : "bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border)]"
      } ${isFetching && !isLoading ? "opacity-80" : ""}`}
      title={
        available === false
          ? "Credit balance is not exposed by the Decart API for this key"
          : "Decart API credit balance"
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${
          showBalance
            ? balance < 100
              ? "bg-amber-400"
              : "bg-[var(--accent-success)]"
            : "bg-[var(--border-strong)]"
        } ${isFetching ? "animate-[pulse-dot_1.5s_ease-in-out_infinite]" : ""}`}
      />
      {label}: {display}
    </span>
  );
}
