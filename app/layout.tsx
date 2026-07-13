import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <SessionProvider>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </SessionProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
