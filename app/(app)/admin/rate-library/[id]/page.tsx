import { RateDetailView } from "./view";
import { RATE_LIBRARY } from "@/lib/data/rate-library";

export function generateStaticParams() {
  return RATE_LIBRARY.map((r) => ({ id: r.id }));
}

export default async function RateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RateDetailView id={id} />;
}
