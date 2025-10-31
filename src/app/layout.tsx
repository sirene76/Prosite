import type { Metadata } from "next";
import "./globals.css";
// import "@/styles/builder-dark.css";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import Navbar from "@/components/Navbar";
import SessionWrapper from "@/components/SessionWrapper";
import { ourFileRouter } from "@/app/api/uploadthing/route";

export const metadata: Metadata = {
  title: "Prosite Builder",
  description: "Craft professional websites with Prosite's builder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-builder-background">
      <body className="min-h-screen bg-builder-background text-slate-100 antialiased">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <SessionWrapper>
          <Navbar />
          <main>{children}</main>
        </SessionWrapper>
      </body>
    </html>
  );
}
