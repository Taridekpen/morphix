import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isDesktopApp } from "@/lib/runtimeEnv";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const desktopMode = isDesktopApp();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/studio", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
      navigate("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)] animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className={`w-full animate-fade-up ${desktopMode ? "max-w-sm" : "max-w-md"}`}>
        <div className="text-center mb-8">
          <div
            className={`rounded-xl bg-[var(--primary)] text-black font-bold flex items-center justify-center mx-auto mb-4 font-display ${
              desktopMode ? "w-10 h-10 text-sm tracking-widest" : "w-12 h-12 text-lg"
            }`}
          >
            {desktopMode ? "MX" : "M"}
          </div>
          <h1 className={`font-semibold text-[var(--primary)] font-display tracking-wider ${desktopMode ? "text-xl" : "text-2xl"}`}>
            {desktopMode ? "MORPHIX // ACCESS" : "Morphix"}
          </h1>
          <p className={`mt-2 text-[var(--text-muted)] font-display ${desktopMode ? "text-xs tracking-wide" : "text-sm text-[var(--text-secondary)]"}`}>
            {isRegister
              ? desktopMode
                ? "REGISTER NEW OPERATOR"
                : "Create your account to open the studio"
              : desktopMode
                ? "AUTHENTICATE TO CONTINUE"
                : "Sign in to your studio"}
          </p>
        </div>

        <Card className={desktopMode ? "desktop-panel desktop-glow" : ""}>
          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              {error && <Alert variant="error">{error}</Alert>}
              <Button variant="primary" type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-[var(--border)] text-center">
              <button
                type="button"
                className="text-sm text-[var(--primary)] hover:underline font-medium"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
              >
                {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
