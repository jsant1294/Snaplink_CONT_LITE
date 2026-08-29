import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        source: "/pitch",
        destination: "/pitch.html",
        permanent: false,
      },
    ];
  },
  // PATCH 1 — safe, low-risk security headers. A strict CSP is intentionally
  // NOT added here; it must be validated against all current scripts, Vercel
  // assets, future Stripe integration, Blob media, and inline behavior first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
