import Link from "next/link";

import { HeroHeading } from "@/components/marketing/HeroHeading";

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-20 lg:grid-cols-2">
        <div className="relative z-10 space-y-10">
          <HeroHeading />
          <p className="max-w-lg text-xl font-light leading-relaxed text-white/60">
            CovenantOS reads facility documents, extracts covenants, collects
            paid evidence via x402, detects breaches, and enforces escrow flows
            on Casper through PolicyGuard — before any fund moves without human
            approval.
          </p>
          <div className="flex flex-col items-start gap-4 pt-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-medium text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:bg-white/90 sm:w-auto"
            >
              Open dashboard
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-xl border border-white/20 px-8 py-4 text-center font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white sm:w-auto"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
          <div className="absolute inset-0 grid-pattern opacity-60" />
          <svg
            viewBox="0 0 480 320"
            className="relative z-10 h-full w-full p-6"
            role="img"
            aria-label="CovenantOS flow: issuer uploads docs, Document Agent extracts covenants, x402 fetches evidence, PolicyGuard enforces escrow"
          >
            <text x="40" y="60" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="Inter, sans-serif">
              Issuer
            </text>
            <rect x="20" y="70" width="80" height="50" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" />
            <text x="140" y="100" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="JetBrains Mono, monospace">
              docs
            </text>
            <line x1="100" y1="95" x2="160" y2="95" stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
            <rect x="160" y="70" width="100" height="50" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" />
            <text x="175" y="100" fill="rgba(255,255,255,0.75)" fontSize="11" fontFamily="Inter, sans-serif">
              Document Agent
            </text>
            <line x1="260" y1="95" x2="320" y2="95" stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
            <rect x="320" y="70" width="90" height="50" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" />
            <text x="332" y="92" fill="rgba(255,255,255,0.75)" fontSize="11" fontFamily="Inter, sans-serif">
              x402 evidence
            </text>
            <line x1="210" y1="120" x2="210" y2="180" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
            <rect x="150" y="180" width="120" height="55" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" />
            <text x="168" y="212" fill="white" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
              PolicyGuard
            </text>
            <line x1="270" y1="207" x2="340" y2="207" stroke="rgba(255,255,255,0.4)" />
            <rect x="340" y="180" width="100" height="55" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" />
            <text x="352" y="212" fill="rgba(255,255,255,0.75)" fontSize="11" fontFamily="Inter, sans-serif">
              FacilityVault
            </text>
            <text x="240" y="280" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="JetBrains Mono, monospace">
              Casper testnet · multisig approval
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "<5s", label: "Breach-to-dashboard alert" },
    { value: "x402", label: "Paid evidence negotiation" },
    { value: "3/3", label: "PolicyGuard threshold demo" },
  ];
  return (
    <section className="border-y border-white/10 bg-white/[0.03] backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center space-y-1 text-center ${i === 1 ? "md:border-x md:border-white/10 md:px-12" : ""}`}
            >
              <span className="font-mono text-4xl font-medium tracking-tighter text-white">
                {stat.value}
              </span>
              <span className="text-xs font-medium uppercase tracking-widest text-white/40">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Document Agent",
      description:
        "PDF and CSV facility docs become structured covenants with confidence scores and source quotes — low confidence routes to human review.",
    },
    {
      title: "x402 evidence gateway",
      description:
        "Budget-capped paid data fetches from bank and ERP providers. Every payload hash lands on-chain as an EvidenceReceipt.",
    },
    {
      title: "PolicyGuard",
      description:
        "Associated-key thresholds gate hold, release, and pause actions. Agents propose; contracts enforce.",
    },
    {
      title: "EvidenceReceipt",
      description:
        "Only hashes and payment refs on-chain — PII stays off-chain while auditors replay the decision chain.",
    },
    {
      title: "Multisig approval",
      description:
        "Compliance officers sign with CSPR.click. Weight accumulates until PolicyGuard executes the waterfall.",
    },
    {
      title: "Audit trail",
      description:
        "Evidence → agent reasoning → policy outcome → approvals → transactions — exportable JSON for regulators.",
    },
  ];

  return (
    <section id="features" className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <h2 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Post-issuance servicing,
            <br /> not just tokenization.
          </h2>
          <p className="text-lg font-light text-white/50">
            CovenantOS targets the gap after RWA issuance: covenant monitoring,
            reserve triggers, and policy-driven cashflow on Casper.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group">
              <div className="mb-6 flex h-40 items-end rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors group-hover:border-white/20 group-hover:bg-white/[0.07]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                  {f.title.split(" ")[0]}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">{f.title}</h3>
              <p className="text-sm font-light leading-relaxed text-white/50">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const useCases = [
  {
    href: "/dashboard",
    title: "Factoring desk",
    description:
      "Monitor invoice aging and DSCR covenants across receivable pools with automated breach holds.",
    accent: "aging · dscr · hold",
  },
  {
    href: "/dashboard",
    title: "Private credit pool",
    description:
      "LTV and reserve covenants tied to collateral marks — officers approve releases through PolicyGuard.",
    accent: "ltv · reserve · release",
  },
  {
    href: "/facilities/new",
    title: "Tokenized receivables",
    description:
      "Onboard new facilities from finance docs in minutes; register covenants on Casper testnet.",
    accent: "extract · register · monitor",
  },
  {
    href: "/approvals",
    title: "RWA treasury",
    description:
      "Auditable escrow with x402-sourced bank statements and multisig remediation flows.",
    accent: "evidence · approve · audit",
  },
] as const;

function UseCasesSection() {
  return (
    <section
      id="use-cases"
      className="border-y border-white/10 bg-white/[0.02] py-32 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for RWA operators.
          </h2>
          <p className="text-lg font-light text-white/50">
            Issuers, servicers, and compliance teams share one truth source from
            document extraction through on-chain enforcement.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {useCases.map((u) => (
            <Link
              key={u.title}
              href={u.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.07]"
            >
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
                {u.accent}
              </div>
              <h3 className="mb-3 text-2xl font-semibold text-white">{u.title}</h3>
              <p className="mb-6 font-light leading-relaxed text-white/55">
                {u.description}
              </p>
              <span className="flex items-center gap-2 text-sm font-medium text-white/60 group-hover:text-white">
                Explore
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      n: "01",
      title: "Upload facility docs",
      body: "Finance agreements go to Document Agent. Structured covenants include thresholds, cadence, and source quotes.",
    },
    {
      n: "02",
      title: "Collect paid evidence",
      body: "Covenant Agent triggers x402 calls to bank and ERP providers. Payload hashes become EvidenceReceipts on Casper.",
    },
    {
      n: "03",
      title: "Breach → hold → release",
      body: "On breach, agents propose holds. Officers approve via CSPR.click until PolicyGuard executes the waterfall.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="overflow-hidden border-y border-white/10 bg-white/[0.02] py-32"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-3xl font-semibold text-white">How it works</h2>
          <p className="text-white/50">From document to enforced policy in three steps</p>
        </div>
        <div className="space-y-16">
          {steps.map((step) => (
            <div
              key={step.n}
              className="flex flex-col gap-6 md:flex-row md:items-start"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] font-mono text-lg font-medium">
                {step.n}
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-medium text-white">
                  {step.title}
                </h3>
                <p className="max-w-xl font-light leading-relaxed text-white/50">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-8 text-4xl font-semibold tracking-tight sm:text-5xl">
          Ready to monitor your first facility?
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-lg font-light text-white/50">
          Built for the Casper Agentic Buildathon — upload a sample facility,
          trigger a breach, and watch policy-driven escrow on testnet.
        </p>
        <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
          <Link
            href="/facilities/new"
            className="w-full rounded-xl bg-white px-10 py-4 font-medium text-black shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all hover:bg-white/90 sm:w-auto"
          >
            Create facility
          </Link>
          <Link
            href="/dashboard"
            className="w-full rounded-xl border border-white/20 px-10 py-4 text-center font-medium text-white/70 transition-colors hover:border-white/50 hover:text-white sm:w-auto"
          >
            Open dashboard
          </Link>
        </div>
        <div className="mt-20 border-t border-white/10 pt-16">
          <p className="mb-8 font-mono text-xs uppercase tracking-widest text-white/30">
            Powered by Casper
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 md:gap-14">
            <span className="text-lg font-bold tracking-tight">Odra</span>
            <span className="text-lg font-bold tracking-tight">x402</span>
            <span className="text-lg font-bold tracking-tight">CSPR.click</span>
            <span className="text-lg font-bold tracking-tight">CSPR.cloud</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <UseCasesSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
