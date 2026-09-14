import { VendorDetailView } from "./view";
import { VENDORS } from "@/lib/data/vendors";

export function generateStaticParams() {
  return VENDORS.map((v) => ({ id: v.id }));
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VendorDetailView id={id} />;
}
