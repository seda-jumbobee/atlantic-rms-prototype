"use client";

import {
  Package,
  Truck,
  TrainFront,
  Wrench,
  Droplets,
  PackageOpen,
  Container,
  Anchor,
  Ship,
  MapPin,
  Sparkles,
  Plus,
  type LucideIcon,
} from "lucide-react";
import type { RouteStepKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StepKindMeta {
  kind: RouteStepKind;
  label: string;
  icon: LucideIcon;
  /** lucide icon name persisted on the step */
  iconName: string;
  description: string;
}

/** Catalog of every step kind a manager can drop into a route. */
export const STEP_CATALOG: StepKindMeta[] = [
  { kind: "commodity", label: "Commodity", icon: Package, iconName: "Package", description: "Set commodity & origin location" },
  { kind: "trucking", label: "Trucking", icon: Truck, iconName: "Truck", description: "Inland haul, origin → CFS" },
  { kind: "rail", label: "Rail", icon: TrainFront, iconName: "TrainFront", description: "Rail pre-carriage leg" },
  { kind: "disassembly", label: "Disassembly", icon: Wrench, iconName: "Wrench", description: "Strip / partial teardown" },
  { kind: "washing", label: "Washing", icon: Droplets, iconName: "Droplets", description: "Steam clean for biosecurity" },
  { kind: "loading", label: "Loading", icon: PackageOpen, iconName: "PackageOpen", description: "Crane / forklift load & lash" },
  { kind: "cfs_packing", label: "CFS Packing", icon: Container, iconName: "Container", description: "Container stuffing at CFS" },
  { kind: "drayage", label: "Drayage", icon: Truck, iconName: "Truck", description: "CFS → port short haul" },
  { kind: "ocean", label: "Ocean", icon: Ship, iconName: "Ship", description: "Main sea leg · search lines" },
  { kind: "oncarriage", label: "On-carriage", icon: MapPin, iconName: "MapPin", description: "Destination port → consignee" },
  { kind: "custom", label: "Custom step", icon: Anchor, iconName: "Anchor", description: "Free-form name, price & days" },
  { kind: "ai_vendor", label: "AI vendor search", icon: Sparkles, iconName: "Sparkles", description: "Let AI source a regional carrier" },
];

export function getStepMeta(kind: RouteStepKind): StepKindMeta {
  return STEP_CATALOG.find((s) => s.kind === kind) ?? STEP_CATALOG[STEP_CATALOG.length - 1];
}

export function AddStepMenu({ onAdd, kinds }: { onAdd: (kind: RouteStepKind) => void; kinds?: RouteStepKind[] }) {
  const catalog = kinds ? STEP_CATALOG.filter((s) => kinds.includes(s.kind)) : STEP_CATALOG;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add route stage
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Add a route stage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {catalog.map((s) => {
          const Icon = s.icon;
          return (
            <DropdownMenuItem key={s.kind} onClick={() => onAdd(s.kind)} className="gap-2.5 py-2">
              <Icon className="size-4 shrink-0 text-primary" />
              <span className="flex flex-col">
                <span className="text-sm font-medium leading-none">{s.label}</span>
                <span className="mt-1 text-xs text-muted-foreground">{s.description}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
