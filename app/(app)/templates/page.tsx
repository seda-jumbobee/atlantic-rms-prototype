"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2, LayoutTemplate, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { QUOTE_TEMPLATES, getPort, getAddress } from "@/lib/data";
import { encodeSearch } from "@/lib/search-params";
import { relativeAge } from "@/lib/format";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function locationName(portId?: string, addressId?: string): string {
  return getPort(portId)?.name ?? getAddress(addressId)?.city ?? "—";
}

export default function TemplatesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Templates"
        description="Ready-to-use quote templates for frequently-repeated lanes & service sets."
      >
        <Button
          onClick={() =>
            toast("Coming from a quote — saved as template")
          }
        >
          <FilePlus2 className="size-4" />
          Save current as template
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUOTE_TEMPLATES.map((t) => {
          const origin = locationName(t.originPortId, t.originAddressId);
          const dest = locationName(t.destPortId, t.destAddressId);
          const href = `/quote-master?${encodeSearch({
            originPortId: t.originPortId,
            originAddressId: t.originAddressId,
            destPortId: t.destPortId,
            destAddressId: t.destAddressId,
            equipmentId: t.equipmentId,
            commodityKind: t.commodityKind,
            commodityLabel: t.commodityLabel,
            shipmentType: t.shipmentType,
            container: t.container,
            advancedSearch: false,
          })}`;

          return (
            <Card key={t.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <LayoutTemplate className="size-4" />
                  </span>
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-snug">
                      {t.name}
                    </CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {/* Lane */}
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{origin}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{dest}</span>
                </div>

                {/* Commodity + shipment */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t.commodityLabel}
                  </span>
                  <Badge variant="secondary">{t.shipmentType}</Badge>
                  {t.container && (
                    <Badge variant="outline" className="font-mono">
                      {t.container}
                    </Badge>
                  )}
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1.5">
                  {t.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-3 border-t">
                <div className="flex flex-col text-xs text-muted-foreground">
                  <span className="font-medium tabular-nums text-foreground">
                    used {t.usageCount}×
                  </span>
                  <span>{relativeAge(t.lastUsed)}</span>
                </div>
                <Button asChild size="sm">
                  <Link href={href}>
                    <Wand2 className="size-4" />
                    Use template
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
