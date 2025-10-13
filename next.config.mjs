import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.ufs.sh" },
      // UploadThing
      { protocol: "https", hostname: "utfs.io" },
      // Unsplash
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Pinterest CDN
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },


    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-ace": path.resolve(__dirname, "src/lib/stub-react-ace.tsx"),
      "ace-builds/src-noconflict/mode-html": path.resolve(
        __dirname,
        "src/lib/ace-stubs/mode-html.ts",
      ),
      "ace-builds/src-noconflict/mode-css": path.resolve(
        __dirname,
        "src/lib/ace-stubs/mode-css.ts",
      ),
      "ace-builds/src-noconflict/mode-json": path.resolve(
        __dirname,
        "src/lib/ace-stubs/mode-json.ts",
      ),
      "ace-builds/src-noconflict/theme-one_dark": path.resolve(
        __dirname,
        "src/lib/ace-stubs/theme-one_dark.ts",
      ),
    };
    return config;
  },
};

export default nextConfig;
