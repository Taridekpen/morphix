import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";

export function AdminPage() {
  const queryClient = useQueryClient();
  const [wallet, setWallet] = useState("");
  const [network, setNetwork] = useState("Ethereum");
  const [currency, setCurrency] = useState("ETH");
  const [instructions, setInstructions] = useState("");

  const { data: pending = [] } = useQuery({ queryKey: ["pendingPayments"], queryFn: api.getPendingPayments });
  const { data: users = [] } = useQuery({ queryKey: ["adminUsers"], queryFn: api.getUsers });
  const { data: paymentConfig } = useQuery({ queryKey: ["paymentConfig"], queryFn: api.getPaymentConfig });

  useEffect(() => {
    if (paymentConfig) {
      setWallet(paymentConfig.walletAddress);
      setNetwork(paymentConfig.network);
      setCurrency(paymentConfig.currency);
      setInstructions(paymentConfig.instructions);
    }
  }, [paymentConfig]);

  const approve = useMutation({
    mutationFn: api.approvePayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pendingPayments"] }),
  });

  const reject = useMutation({
    mutationFn: api.rejectPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pendingPayments"] }),
  });

  const updateConfig = useMutation({
    mutationFn: () =>
      api.updatePaymentConfig({ walletAddress: wallet, network, currency, instructions }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paymentConfig"] }),
  });

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <PageHeader
        title="Admin"
        description="Manage payment configuration, approve subscriptions, and view users."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Payment configuration</h2>
          </CardHeader>
          <CardBody>
            <Input label="Wallet address" value={wallet} onChange={(e) => setWallet(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Network" value={network} onChange={(e) => setNetwork(e.target.value)} />
              <Input label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <Input label="Payment instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            <Button variant="primary" onClick={() => updateConfig.mutate()} disabled={updateConfig.isPending}>
              Save configuration
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              Pending payments
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">({pending.length})</span>
            </h2>
          </CardHeader>
          <CardBody className="gap-4">
            {pending.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">No payments awaiting review.</p>
            )}
            {pending.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 space-y-3"
              >
                <div className="text-sm space-y-1">
                  <p className="font-medium">{sub.plan?.name} — ${sub.plan?.priceUsd}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono break-all">TX: {sub.txHash}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={() => approve.mutate(sub.id)} disabled={approve.isPending}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => reject.mutate(sub.id)} disabled={reject.isPending}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              Users
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">({users.length})</span>
            </h2>
          </CardHeader>
          <CardBody className="gap-0 p-0 sm:p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/50">
                    <th className="text-left px-5 py-3 font-medium text-[var(--text-muted)]">Email</th>
                    <th className="text-left px-5 py-3 font-medium text-[var(--text-muted)]">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-5 py-3 text-[var(--text-primary)]">{u.email}</td>
                      <td className="px-5 py-3 capitalize text-[var(--text-secondary)]">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Alert variant="info">
          Approved subscriptions activate immediately and apply the selected plan&apos;s usage limits.
        </Alert>
      </div>
    </div>
  );
}
