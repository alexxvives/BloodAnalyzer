import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Local `next dev` can leave unpdf external (Node loads it from
  // node_modules). Production OpenNext/Workers must bundle it — marking it
  // serverExternalPackages emits a hashed id (`unpdf-<hash>`) that Wrangler
  // never registers, so PDF parse fails with "No such module".
  ...(process.env.NODE_ENV === "development"
    ? { serverExternalPackages: ["unpdf"] }
    : {}),
};

export default nextConfig;
