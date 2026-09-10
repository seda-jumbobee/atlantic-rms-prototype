import { Suspense } from "react";
import { QuoteMaster } from "@/components/quote/quote-master";

export const metadata = {
  title: "Rate Quote · RMS",
};

export default function QuoteMasterPage() {
  return (
    // No padding on the fallback: the app shell already insets the content
    // area, so p-8 here doubled the gutter for as long as it was on screen.
    <Suspense fallback={<p className="text-body text-muted-foreground">Loading Rate Quote…</p>}>
      <QuoteMaster />
    </Suspense>
  );
}
