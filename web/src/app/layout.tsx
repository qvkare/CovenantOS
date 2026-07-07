import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CovenantOS · Agentic Covenant Monitoring on Casper",
    template: "%s · CovenantOS",
  },
  description:
    "Tokenized private credit covenant monitoring, x402 evidence, and policy-driven escrow on Casper Network.",
  icons: {
    icon: [{ url: "/covenantos-wordmark.png", type: "image/png" }],
    shortcut: "/covenantos-wordmark.png",
    apple: "/covenantos-wordmark.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-black font-sans text-white antialiased selection:bg-white selection:text-black`}
      >
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <div id="csprclick-ui" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
