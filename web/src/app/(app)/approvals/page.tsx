"use client";

import type { ProposedAction } from "@covenantos/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { ApprovalProgress } from "@/components/covenant/approval-progress";
import { EmptyState } from "@/components/covenant/empty-state";
import { HashBlock } from "@/components/covenant/hash-block";
import { PageHeader } from "@/components/covenant/page-header";
import { TxLink } from "@/components/covenant/tx-link";
import { signPolicyApproval } from "@/lib/casper/approval-signature";
import { useClickWallet } from "@/lib/casper/click-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  approveAction,
  listActions,
  rejectAction,
} from "@/lib/api-client";

export default function ApprovalsPage() {
  const { publicKey, clickRef } = useClickWallet();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["actions", "pending"],
    queryFn: () => listActions("pending"),
  });

  const approveMutation = useMutation({
    mutationFn: async (action: ProposedAction) => {
      if (!publicKey) throw new Error("Connect wallet first");
      if (!clickRef) throw new Error("CSPR.click is not ready");

      const signature = await signPolicyApproval(clickRef, action, publicKey);
      const approvalRef = `eip712-${signature.slice(0, 16)}${action.id.slice(-8)}`;

      return approveAction(action.id, {
        approver: publicKey,
        txHash: approvalRef,
      });
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["actions"] });
      void queryClient.invalidateQueries({ queryKey: ["facility"] });
      toast.success(
        res.action.status === "executed"
          ? "Action executed on-chain"
          : "Approval recorded",
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Action rejected");
    },
  });

  const actions = data?.actions ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Compliance · Approvals"
        title="Policy approval queue"
        description="AI agents propose holds and releases. Officers sign with CSPR.click before PolicyGuard moves funds."
        action={
          <Button variant="destructive" size="sm" disabled title="Demo kill-switch">
            Pause facility
          </Button>
        }
      />

      {!publicKey ? (
        <EmptyState
          title="Wallet required"
          description="Connect with CSPR.click to approve proposed actions."
        />
      ) : isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      ) : actions.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="When Covenant Agent proposes a hold or release after a breach check, it appears here until fully executed."
        />
      ) : (
        <div className="grid gap-4">
          {actions.map((action) => (
            <Card key={action.id}>
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg uppercase">
                      {action.type}
                    </CardTitle>
                    <Badge variant="outline">{action.status}</Badge>
                  </div>
                  <CardDescription>
                    Facility{" "}
                    <Link
                      href={`/facilities/${action.facilityId}`}
                      className="font-mono text-white/70 hover:text-white"
                    >
                      {action.facilityId}
                    </Link>
                  </CardDescription>
                </div>
                <ApprovalProgress
                  current={action.currentApprovalWeight}
                  required={action.requiredApprovalWeight}
                  className="w-full max-w-xs"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {action.reasoningSummary ? (
                  <p className="text-sm text-white/70">
                    {action.reasoningSummary}
                  </p>
                ) : null}
                {action.paramsHash ? (
                  <div>
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
                      Params hash
                    </div>
                    <HashBlock value={action.paramsHash} />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => approveMutation.mutate(action)}
                    disabled={approveMutation.isPending}
                  >
                    Approve with wallet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => rejectMutation.mutate(action.id)}
                    disabled={rejectMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
                {action.onchainActionId ? (
                  <TxLink hash={action.onchainActionId} label="action" />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
