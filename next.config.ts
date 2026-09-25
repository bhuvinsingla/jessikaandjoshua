import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/": ["./public/wedding-body.html"],
  },
};

export default nextConfig;
