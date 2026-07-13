import { Suspense } from "react";
import { QuoteMaster } from "@/components/quote/quote-master";

export default function QuoteMasterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading Quote Master…</div>}>
      <QuoteMaster />
    </Suspense>
  );
}
