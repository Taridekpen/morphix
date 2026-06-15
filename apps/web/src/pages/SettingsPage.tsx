import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [txHash, setTxHash] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: api.getPlans });
  const { data: paymentConfig } = useQuery({ queryKey: ["paymentConfig"], queryFn: api.getPaymentConfig });
  const { data: billing } = useQuery({ queryKey: ["subscription"], queryFn: api.getSubscription });

  const updateSettings = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const submitPayment = useMutation({
    mutationFn: ({ planId, txHash: hash }: { planId: string; txHash: string }) =>
      api.submitPayment(planId, hash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      setTxHash("");
    },
  });

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance, and subscription."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Profile</h2>
          </CardHeader>
          <CardBody className="gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide">Email</p>
                <p className="mt-1 font-medium text-[var(--text-primary)]">{user?.email}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide">Role</p>
                <p className="mt-1 font-medium capitalize text-[var(--text-primary)]">{user?.role}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Appearance</h2>
          </CardHeader>
          <CardBody>
            <Select label="Theme" value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
            <Button variant="secondary" size="sm" onClick={() => updateSettings.mutate({ theme })}>
              Save preference
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Billing</h2>
          </CardHeader>
          <CardBody>
            {billing?.subscription ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 p-4 text-sm space-y-1 mb-4">
                <p>
                  Status:{" "}
                  <span className="font-semibold capitalize">{billing.subscription.status.replace("_", " ")}</span>
                </p>
                {billing.subscription.plan && (
                  <p>Plan: <span className="font-medium">{billing.subscription.plan.name}</span></p>
                )}
                {billing.subscription.expiresAt && (
                  <p>Expires: {new Date(billing.subscription.expiresAt).toLocaleDateString()}</p>
                )}
              </div>
            ) : (
              <Alert variant="info" className="mb-4">No active subscription. Choose a plan below to get started.</Alert>
            )}

            {billing?.usage && (
              <UsageMeter
                label="Face usage"
                used={Math.round(billing.usage.faceSecondsUsed / 60)}
                limit={Math.round(billing.usage.faceMinutesLimit / 60)}
              />
            )}

            <Select label="Select a plan" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
              <option value="">Choose a plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.priceUsd}/month
                </option>
              ))}
            </Select>

            {selectedPlan && paymentConfig && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 p-4 text-sm space-y-3">
                <p>
                  Send <strong>${selectedPlan.priceUsd} {paymentConfig.currency}</strong> on {paymentConfig.network} to:
                </p>
                <code className="block text-xs break-all p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] font-mono">
                  {paymentConfig.walletAddress}
                </code>
                <p className="text-xs text-[var(--text-muted)]">{paymentConfig.instructions}</p>
              </div>
            )}

            <Input
              label="Transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste your payment transaction hash"
            />

            <Button
              variant="primary"
              disabled={!selectedPlanId || !txHash || submitPayment.isPending}
              onClick={() => submitPayment.mutate({ planId: selectedPlanId, txHash })}
            >
              {submitPayment.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold mt-1">{used}m / {limit}m</p>
      <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
