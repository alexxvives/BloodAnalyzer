import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Keep unpdf out of the bundler — Turbopack has choked on its ESM before.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
