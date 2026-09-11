"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { money } from "@/lib/format";
import { chargeTotal } from "@/lib/quote-engine";
import type { ChargeLine } from "@/lib/types";

/* ============================================================================
   Charge lines — the densest table in the product, and now the shared one.

   It runs at density="compact" (36px rows against the default 52): this is a
   block of figures to be read down a column, not a list of records to be
   scanned a row at a time, and at the default height a six-charge service
   filled a screen. Money columns are `numeric`, so they align on their right
   edge and on their digits.
   ========================================================================= */

let n = 0;
const newId = () => `ch-new-${++n}`;

export function ChargeTable({
  charges,
  onChange,
  editable = true,
}: {
  charges: ChargeLine[];
  onChange: (charges: ChargeLine[]) => void;
  editable?: boolean;
}) {
  const update = (id: string, patch: Partial<ChargeLine>) =>
    onChange(charges.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => onChange(charges.filter((c) => c.id !== id));
  const add = () =>
    onChange([...charges, { id: newId(), code: "", name: "New charge", basis: "Container", qty: 1, currency: "USD", unitCost: 0 }]);

  const subtotal = charges.reduce((s, c) => s + chargeTotal(c), 0);

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--c-table-border)]">
      <Table plain density="compact" className="min-w-[440px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">Code</TableHead>
            <TableHead>Charge</TableHead>
            <TableHead className="hidden sm:table-cell">Basis</TableHead>
            <TableHead numeric className="w-14">Qty</TableHead>
            <TableHead numeric className="w-28">Unit cost</TableHead>
            <TableHead numeric className="w-24">Total</TableHead>
            {editable && <TableHead className="w-9" aria-label="Row actions" />}
          </TableRow>
        </TableHeader>

        <TableBody>
          {charges.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                {editable ? (
                  <Input value={c.code ?? ""} onChange={(e) => update(c.id, { code: e.target.value })} aria-label={`Charge code for ${c.name || "charge"}`} size="xs" className="font-mono text-xs" />
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                )}
              </TableCell>
              <TableCell className="whitespace-normal">
                {editable ? (
                  <Input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} aria-label="Charge name" size="xs" />
                ) : (
                  c.name
                )}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{c.basis}</TableCell>
              <TableCell numeric>
                {editable ? (
                  <Input type="number" value={c.qty} onChange={(e) => update(c.id, { qty: Number(e.target.value) })} aria-label={`Quantity for ${c.name || "charge"}`} size="xs" className="text-right tabular-nums" />
                ) : (
                  c.qty
                )}
              </TableCell>
              <TableCell numeric>
                {editable ? (
                  <Input type="number" value={c.unitCost} onChange={(e) => update(c.id, { unitCost: Number(e.target.value) })} aria-label={`Unit cost for ${c.name || "charge"}`} size="xs" className="text-right tabular-nums" />
                ) : (
                  money(c.unitCost)
                )}
              </TableCell>
              <TableCell numeric className="font-medium">{money(chargeTotal(c))}</TableCell>
              {editable && (
                <TableCell>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => remove(c.id)} aria-label={`Remove ${c.name || "charge"}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={editable ? 5 : 5} numeric className="font-medium">Service subtotal</TableCell>
            <TableCell numeric className="font-bold text-foreground">{money(subtotal)}</TableCell>
            {editable && <TableCell />}
          </TableRow>
        </TableFooter>
      </Table>

      {editable && (
        // A real button, not a strip of text: it is the only way to add a line,
        // and it used to read as a caption under the table.
        <div className="border-t border-[var(--c-table-border)] p-1.5">
          <Button variant="ghost" size="sm" onClick={add} className="w-full justify-center">
            <Plus className="size-4" /> Add charge
          </Button>
        </div>
      )}
    </div>
  );
}
