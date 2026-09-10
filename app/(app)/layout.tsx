"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { useSession } from "@/components/session-provider";
import { LogoMark } from "@/components/logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();
  // Controlled sidebar state so the collapse choice persists across reloads
  // (SidebarProvider writes the `sidebar_state` cookie; we read it back here).
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )sidebar_state=(true|false)/)?.[1];
    if (saved) setSidebarOpen(saved === "true");
  }, []);

  if (!ready || !user) {
    return (
      <div className="grid min-h-svh place-items-center bg-shell">
        <LogoMark className="size-12 animate-pulse" />
      </div>
    );
  }

  return (
    // --shell is the frame the whole app sits on; SidebarInset is the rounded
    // content surface floating on it (Figma "04 - Screens / Dashboard").
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen} className="bg-shell">
      <AppSidebar />
      {/* The content surface owns its inset in ONE place, so the search row
          and the page below it can never drift apart: 32px on all four sides
          at md and up (Figma "04 - Screens / Dashboard"), stepping down to 24
          and 16 as the viewport narrows. The same step drives the gap between
          the two rows, which the reference also sets to 32. */}
      <SidebarInset className="min-w-0 gap-4 overflow-hidden p-4 sm:gap-6 sm:p-6 md:gap-8 md:p-8">
        <AppTopbar />
        <main className="min-w-0 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
