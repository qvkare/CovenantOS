import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@covenantos/shared"],
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/covenantos-wordmark.png",
        permanent: true,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    NEXT_PUBLIC_MSW: process.env.NEXT_PUBLIC_MSW ?? "false",
    NEXT_PUBLIC_CSPRCLICK_APP_ID:
      process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID ?? "csprclick-template",
  },
};

export default nextConfig;
