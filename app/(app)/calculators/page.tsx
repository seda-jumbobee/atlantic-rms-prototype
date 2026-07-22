import Link from "next/link";
import {
  Ship,
  Truck,
  Forklift,
  CarFront,
  Container,
  Maximize,
  Box,
  TruckElectric,
  Calculator,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CALCULATORS } from "@/lib/data";

const ICONS: Record<string, LucideIcon> = {
  Ship,
  Truck,
  Forklift,
  CarFront,
  Container,
  Maximize,
  Box,
  TruckElectric,
  Calculator,
};

export default function CalculatorsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Calculators"
        description="Standalone pricing tools — each mirrors a tab of the RMS rate workbook."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CALCULATORS.map((c) => {
          const Icon = ICONS[c.icon] ?? Calculator;
          return (
            <Link key={c.id} href={`/calculators/${c.id}`}>
              <Card className="group h-full p-5 transition hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-muted text-primary transition group-hover:bg-primary/10">
                    <Icon className="size-5" />
                  </div>
                  {c.region && (
                    <Badge variant="outline" className="text-caption">
                      {c.region}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1 font-medium">
                  {c.name}
                  <ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
                <div className="mt-3 text-caption uppercase tracking-wide text-muted-foreground">{c.unit}</div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
