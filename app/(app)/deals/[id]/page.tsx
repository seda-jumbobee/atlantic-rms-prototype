import { DealDetailView } from "./view";
import { DEALS } from "@/lib/data/deals";

/* A server shell around the client view, purely so this route can be
   pre-rendered: Next refuses `generateStaticParams` in a "use client" file, and
   the static export needs every id known at build time. */
export function generateStaticParams() {
  return DEALS.map((d) => ({ id: d.id }));
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealDetailView id={id} />;
}
