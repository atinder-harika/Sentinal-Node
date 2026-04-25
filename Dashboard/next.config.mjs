/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Native / server-only SDKs that must NOT be bundled by Turbopack.
  // PRD §7 — Google Cloud Vision, Snowflake, Auth0, ElevenLabs all touch
  // node-only APIs (fs, net, native bindings) and must be loaded at runtime.
  serverExternalPackages: [
    "@google-cloud/vision",
    "snowflake-sdk",
    "@auth0/nextjs-auth0",
  ],
};

export default nextConfig;
