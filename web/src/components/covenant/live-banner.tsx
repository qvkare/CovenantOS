"use client";

import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LiveBanner({
  title,
  message,
  actionHref,
  actionLabel,
  onDismiss,
  className,
}: {
  title: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-red-100",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
      <div className="flex-1 space-y-2">
        <div className="font-semibold text-red-100">{title}</div>
        {message ? (
          <p className="text-sm font-light text-red-200/80">{message}</p>
        ) : null}
        {actionHref && actionLabel ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-red-300/40 text-red-100 hover:bg-red-400/20"
          >
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-red-200 hover:text-white"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
