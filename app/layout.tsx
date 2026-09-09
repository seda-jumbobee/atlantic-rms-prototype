import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/session-provider";

/* Satoshi — the Figma design-system family, self-hosted from Fontshare
   (free for personal and commercial use). Satoshi ships 300/400/500/700/900
   and has NO 600 weight, so Figma's "SemiBold" styles map to 700 here; that
   mapping lives in the --text-* tokens in globals.css, not in components. */
const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
  src: [
    { path: "../public/fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Atlantic RMS — Rate Management Solution",
    template: "%s · Atlantic RMS",
  },
  description:
    "Rate Management Solution for Atlantic Project Cargo — quote master, route builder, calculators and vendor rates for project & heavy-equipment freight.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${satoshi.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <SessionProvider>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </SessionProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
