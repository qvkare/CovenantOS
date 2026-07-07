import { cn } from "@/lib/utils";

export function ApprovalProgress({
  current,
  required,
  className,
}: {
  current: number;
  required: number;
  className?: string;
}) {
  const pct = required > 0 ? Math.min(100, (current / required) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Approval weight</span>
        <span className="font-mono text-white/80">
          {current}/{required}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
