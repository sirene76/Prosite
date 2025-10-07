/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {}
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**", // allow all paths from utfs.io,
        },
    ],
  }
};

export default nextConfig;
