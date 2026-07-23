import { notFound } from "next/navigation";
import { CalculatorWorkspace } from "@/components/calculators/calculator-workspace";
import { getCalculator } from "@/lib/data";

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
