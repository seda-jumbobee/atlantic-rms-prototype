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
      {/* overflow-CLIP, not hidden. Both clip content to the rounded
          surface, but `hidden` makes this element a scroll container — and a
          scroll container captures every `position: sticky` descendant. Since
          this one is sized to its content it never actually scrolls, so a
          sticky bottom bar bound to it simply never pinned — measured, not
          assumed. `clip` clips identically without establishing a scrollport,
          leaving the document as the scrollport the action bars stick to. */}
      <SidebarInset className="min-w-0 gap-4 overflow-clip p-4 sm:gap-6 sm:p-6 md:gap-8 md:p-8">
        <AppTopbar />
        <main className="min-w-0 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
