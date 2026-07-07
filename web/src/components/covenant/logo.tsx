import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  height?: number;
  className?: string;
};

// Intrinsic ratio of /public/covenantos-wordmark.png (1059 × 144).
const ASPECT = 1059 / 144;

/**
 * CovenantOS wordmark.
 *
 * Ships as /public/covenantos-wordmark.png, a white "CovenantOS" wordmark
 * on a transparent background (derived from the brand asset covenantos.png
 * so it reads correctly on the dark UI). Because the mark already contains
 * the product name, callers should not render a separate text label.
 */
export function CovenantLogo({ height = 24, className }: LogoProps) {
  return (
    <Image
      src="/covenantos-wordmark.png"
      alt="CovenantOS"
      width={Math.round(height * ASPECT)}
      height={height}
      priority
      className={cn("shrink-0", className)}
    />
  );
}
