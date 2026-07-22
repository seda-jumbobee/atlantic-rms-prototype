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
      <div className="grid min-h-svh place-items-center">
        <LogoMark className="size-12 animate-pulse" />
      </div>
    );
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppTopbar />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
