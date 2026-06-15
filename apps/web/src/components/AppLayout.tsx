import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";

const nav = [
  { to: "/studio", label: "Studio" },
  { to: "/settings", label: "Settings" },
  { to: "/help", label: "Help" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (path: string) =>
    `block sm:inline-block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path
        ? "bg-[var(--primary-muted)] text-[var(--primary)]"
        : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]/90 backdrop-blur-md shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <Link to="/studio" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="font-semibold text-[var(--text-primary)] hidden xs:inline">Morphix</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {nav.map((item) => (
                <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                  {item.label}
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link to="/admin" className={linkClass("/admin")}>Admin</Link>
              )}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs text-[var(--text-muted)] hidden lg:block max-w-[180px] truncate">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => logout()}>
                Sign out
              </Button>
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="md:hidden pb-4 flex flex-col gap-1 border-t border-[var(--border)] pt-3">
              {nav.map((item) => (
                <Link key={item.to} to={item.to} className={linkClass(item.to)} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link to="/admin" className={linkClass("/admin")} onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
              <Button variant="secondary" size="sm" className="mt-2 sm:hidden w-full" onClick={() => logout()}>
                Sign out
              </Button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
