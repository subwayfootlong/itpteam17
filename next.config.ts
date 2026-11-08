import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SNFR-03: don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
};

export default nextConfig;
