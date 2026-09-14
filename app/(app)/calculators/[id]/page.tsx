import { notFound } from "next/navigation";
import { CALCULATORS } from "@/lib/data/calculators";
import { CalculatorWorkspace } from "@/components/calculators/calculator-workspace";
import { getCalculator } from "@/lib/data";

/* Every calculator is known at build time, so the static export can
   pre-render each one. */
export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ id: c.id }));
}

export default async function CalculatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meta = getCalculator(id);
  if (!meta) notFound();

  return <CalculatorWorkspace id={meta.id} />;
}
