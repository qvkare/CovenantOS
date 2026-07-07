import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@covenantos/shared"],
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    NEXT_PUBLIC_MSW: process.env.NEXT_PUBLIC_MSW ?? "true",
    NEXT_PUBLIC_CSPRCLICK_APP_ID:
      process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID ?? "csprclick-template",
  },
};

export default nextConfig;
