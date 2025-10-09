/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // UploadThing
      { protocol: "https", hostname: "utfs.io" },
      // Unsplash
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Pinterest CDN
      { protocol: "https", hostname: "i.pinimg.com" },
    ],
  },
};

export default nextConfig;
