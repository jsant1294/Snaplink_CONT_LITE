import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
