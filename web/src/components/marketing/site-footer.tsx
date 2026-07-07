import Link from "next/link";

import { CovenantLogo } from "@/components/covenant/logo";

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-white/[0.03] px-6 py-20 text-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-16 lg:flex-row">
        <div className="space-y-6 lg:w-1/3">
          <div className="flex items-center">
            <CovenantLogo height={26} />
          </div>
          <p className="font-light leading-relaxed text-white/40">
            Agentic covenant monitoring and cashflow waterfall OS for tokenized
            private credit on Casper Network. Reasoning off-chain, enforcement
            on-chain.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:w-2/3">
          <div className="space-y-4">
            <h4 className="font-semibold text-white/80">Product</h4>
            <ul className="space-y-3 text-white/40">
              <li>
                <Link href="/dashboard" className="hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/facilities/new" className="hover:text-white">
                  New facility
                </Link>
              </li>
              <li>
                <Link href="/approvals" className="hover:text-white">
                  Approvals
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-white/80">Casper</h4>
            <ul className="space-y-3 text-white/40">
              <li>
                <a
                  href="https://www.casper.network/ai"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  AI Toolkit
                </a>
              </li>
              <li>
                <a
                  href="https://testnet.cspr.live"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  Testnet explorer
                </a>
              </li>
              <li>
                <a
                  href="https://docs.cspr.click"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  CSPR.click
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-white/80">Buildathon</h4>
            <ul className="space-y-3 text-white/40">
              <li>
                <a
                  href="https://dorahacks.io/hackathon/casper-agentic-buildathon/detail"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  Casper Agentic Buildathon
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-7xl border-t border-white/10 pt-8 text-white/30">
        <p>&copy; {new Date().getFullYear()} CovenantOS</p>
      </div>
    </footer>
  );
}
