"use client";

import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LiveBanner({
  title,
  message,
  onDismiss,
  className,
}: {
  title: string;
  message?: string;
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
      <div className="flex-1 space-y-1">
        <div className="font-semibold text-red-100">{title}</div>
        {message ? (
          <p className="text-sm font-light text-red-200/80">{message}</p>
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
