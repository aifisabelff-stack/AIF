import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.36",
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.1.36:3000",
  ],
};

export default nextConfig;
