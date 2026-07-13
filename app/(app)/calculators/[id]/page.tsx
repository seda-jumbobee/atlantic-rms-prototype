import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CalculatorPanel } from "@/components/calculators/calculator-panels";
import { getCalculator } from "@/lib/data";

export default async function CalculatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meta = getCalculator(id);
  if (!meta) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={meta.name} description={meta.description}>
        {meta.region && <Badge variant="outline">{meta.region}</Badge>}
        <Button variant="outline" size="sm" asChild>
          <Link href="/calculators">
            <ArrowLeft className="size-4" /> All calculators
          </Link>
        </Button>
      </PageHeader>

      <CalculatorPanel id={meta.id} />
    </div>
  );
}
