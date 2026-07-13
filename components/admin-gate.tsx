"use client";

import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useSession } from "@/components/session-provider";

/** Wraps admin-only (Procurement Manager) content. Managers see an access notice. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  if (user?.role !== "admin") {
    return (
      <Card className="mx-auto mt-10 max-w-md p-8 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Lock className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Procurement access only</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This section is restricted to the Procurement Manager. Switch to the Admin role (top bar) to preview it.
        </p>
      </Card>
    );
  }
  return <>{children}</>;
}
