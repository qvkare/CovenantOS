"use client";

import type { CovenantRecord } from "@covenantos/shared";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/covenant/page-header";
import { TxLink } from "@/components/covenant/tx-link";
import { WalletWall } from "@/components/covenant/wallet-wall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClickWallet } from "@/lib/casper/click-context";
import {
  extractCovenants,
  registerFacility,
  updateCovenant,
} from "@/lib/api-client";

const STEPS = ["Upload", "Review covenants", "Register on-chain"] as const;

export default function NewFacilityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations · New facility"
        title="Create facility"
        description="Upload a finance facility document, review AI-extracted covenants, and register on Casper testnet."
        action={
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
        }
      />
      <WalletWall>
        <NewFacilityWizard />
      </WalletWall>
    </div>
  );
}

function NewFacilityWizard() {
  const router = useRouter();
  const { publicKey } = useClickWallet();
  const [step, setStep] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [covenants, setCovenants] = useState<CovenantRecord[]>([]);
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a PDF or CSV first");
      setProgress("Reading facility document…");
      await new Promise((r) => setTimeout(r, 600));
      setProgress("Document Agent extracting covenants…");
      const res = await extractCovenants(file, facilityName || undefined);
      setCovenants(res.covenants);
      setProgress(null);
      return res;
    },
    onSuccess: () => {
      toast.success("Covenants extracted");
      setStep(1);
    },
    onError: (err: Error) => {
      setProgress(null);
      toast.error(err.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const lowConfidence = covenants.some((c) => c.confidence < 0.85 && !c.humanVerified);
      if (lowConfidence) {
        throw new Error("Review and verify low-confidence covenants before registering");
      }
      return registerFacility({
        name: facilityName || "Untitled facility",
        issuer: publicKey ?? "01unknown",
        covenants,
      });
    },
    onSuccess: (res) => {
      setTxHashes(res.txHashes);
      setRegisteredId(res.facility.id);
      setStep(2);
      toast.success("Facility registered on testnet");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateCov = useCallback(
    async (id: string, patch: Partial<CovenantRecord>) => {
      setCovenants((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...patch, humanVerified: true } : c,
        ),
      );
      try {
        await updateCovenant(id, patch);
      } catch {
        // local edits still apply in demo mode
      }
    },
    [],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <Badge
            key={label}
            variant={i === step ? "brand" : i < step ? "success" : "outline"}
          >
            {i + 1}. {label}
          </Badge>
        ))}
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload facility document</CardTitle>
            <CardDescription>
              PDF or CSV — Document Agent extracts covenant types, thresholds,
              and source quotes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Facility name</Label>
              <Input
                id="name"
                placeholder="Northwind Invoice Facility"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Document</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {progress ? (
              <p className="text-sm text-white/50">{progress}</p>
            ) : null}
            <Button
              disabled={!file || extractMutation.isPending}
              onClick={() => extractMutation.mutate()}
            >
              {extractMutation.isPending ? "Extracting…" : "Extract covenants"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          {covenants.map((cov) => {
            const needsReview = cov.confidence < 0.85 && !cov.humanVerified;
            return (
              <Card
                key={cov.id}
                className={
                  needsReview ? "border-yellow-400/40 ring-1 ring-yellow-400/20" : ""
                }
              >
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{cov.type}</CardTitle>
                    <Badge variant={needsReview ? "warning" : "success"}>
                      {(cov.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    {needsReview ? (
                      <Badge variant="warning">Review required</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Threshold</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cov.threshold}
                      onChange={(e) =>
                        void updateCov(cov.id, {
                          threshold: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Source quote</Label>
                    <Textarea
                      value={cov.sourceQuote}
                      onChange={(e) =>
                        void updateCov(cov.id, { sourceQuote: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Submitting transactions…"
                : "Register on Casper"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Facility live on testnet</CardTitle>
            <CardDescription>
              Covenants registered via PolicyGuard. Open the facility dashboard
              to run checks and monitor escrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {txHashes.map((hash) => (
              <TxLink key={hash} hash={hash} />
            ))}
            <Button
              onClick={() =>
                router.push(`/facilities/${registeredId ?? registerMutation.data?.facility.id}`)
              }
            >
              Open facility
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
