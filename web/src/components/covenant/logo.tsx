import { cn } from "@/lib/utils";

export function CovenantLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect
        width="40"
        height="40"
        rx="10"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />
      <path
        d="M12 28V12h4l6 10 6-10h4v16h-3.5V18l-5.5 9h-2.5l-5.5-9v10H12z"
        fill="white"
        fillOpacity="0.92"
      />
      <circle cx="32" cy="10" r="3" fill="#22c55e" fillOpacity="0.9" />
    </svg>
  );
}
