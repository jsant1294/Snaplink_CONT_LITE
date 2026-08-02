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
};

export default nextConfig;
