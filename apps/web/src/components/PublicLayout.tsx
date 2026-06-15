import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
