import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prosite Builder",
  description: "Craft professional websites with Prosite's builder."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-builder-background">
      <body className="min-h-screen bg-builder-background text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
