import { Suspense } from "react";
import { QuoteMaster } from "@/components/quote/quote-master";

export const metadata = {
  title: "Rate Quote · RMS",
};

export default function QuoteMasterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading Rate Quote…</div>}>
      <QuoteMaster />
    </Suspense>
  );
}
