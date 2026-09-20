import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebCraftPro AI \u2014 Real Estate Automation Platform",
  description:
    "AI-powered lead qualification & business automation for real-estate companies. Investor demo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0f1a] text-slate-100">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500 px-4">
            <p>
              WebCraftPro AI \u2014 Investor Demo \u00b7 All metrics labeled as{" "}
              <span className="text-amber-400/90 font-medium">DEMO DATA</span>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
