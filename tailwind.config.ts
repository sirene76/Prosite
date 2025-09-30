import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        builder: {
          background: "#0f172a",
          surface: "#111c3a",
          accent: "#38bdf8",
          muted: "#1e293b"
        }
      }
    }
  },
  plugins: []
};

export default config;
