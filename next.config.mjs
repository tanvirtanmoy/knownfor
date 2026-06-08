/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    // Profile-photo uploads post the file through a server action. The default
    // server-action body limit is 1 MB; raise it so a 2 MB avatar fits with room
    // for the rest of the form fields.
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
