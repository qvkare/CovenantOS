"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { CovenantLogo } from "@/components/covenant/logo";
import { WalletButton } from "@/components/covenant/wallet-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavIconName = "dashboard" | "facility" | "approvals" | "audit";

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/facilities/new", label: "New facility", icon: "facility" },
  { href: "/approvals", label: "Approvals", icon: "approvals" },
];

function NavIcon({ name }: { name: NavIconName }) {
  const base = { className: "h-5 w-5", strokeWidth: 1.5 };
  switch (name) {
    case "dashboard":
      return (
        <svg {...base} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="8" height="10" rx="1" />
          <rect x="13" y="3" width="8" height="6" rx="1" />
          <rect x="13" y="11" width="8" height="10" rx="1" />
          <rect x="3" y="15" width="8" height="6" rx="1" />
        </svg>
      );
    case "facility":
      return (
        <svg {...base} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M12 18v-6" strokeLinecap="round" />
          <path d="M9 15h6" strokeLinecap="round" />
        </svg>
      );
    case "approvals":
      return (
        <svg {...base} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 12l2 2 l4-4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="4" width="18" height="16" rx="2" />
        </svg>
      );
    case "audit":
      return (
        <svg {...base} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7 v5 l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <MobileNav pathname={pathname} />
            <Link href="/dashboard" className="flex items-center">
              <CovenantLogo height={24} />
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-white/[0.02] p-4 md:flex md:flex-col">
          <div className="flex-1">
            <SidebarSection
              label="Overview"
              items={NAV.filter((n) => n.icon === "dashboard")}
              pathname={pathname}
            />
            <SidebarSection
              label="Operations"
              items={NAV.filter((n) => n.icon !== "dashboard")}
              pathname={pathname}
            />
          </div>
          <div className="border-t border-white/10 pt-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              ← Marketing site
            </Link>
          </div>
        </aside>

        <main id="main" className="flex-1 overflow-x-hidden" tabIndex={-1}>
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarSection({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null | undefined;
  onNavigate?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-white/30">
        {label}
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden" />
        <DialogPrimitive.Content
          aria-label="Navigation"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0a0a0a] p-4 shadow-[20px_0_80px_-20px_rgba(0,0,0,0.8)] md:hidden",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center"
              onClick={() => setOpen(false)}
            >
              <CovenantLogo height={22} />
            </Link>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="sr-only">
            Navigation
          </DialogPrimitive.Title>
          <div className="flex-1 overflow-y-auto">
            <SidebarSection
              label="Overview"
              items={NAV.filter((n) => n.icon === "dashboard")}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
            <SidebarSection
              label="Operations"
              items={NAV.filter((n) => n.icon !== "dashboard")}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
