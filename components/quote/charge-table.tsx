"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { chargeTotal } from "@/lib/quote-engine";
import type { ChargeLine } from "@/lib/types";

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
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[440px] text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="w-16 px-2 py-1.5 text-left font-medium">Code</th>
            <th className="px-2 py-1.5 text-left font-medium">Charge</th>
            <th className="hidden px-2 py-1.5 text-left font-medium sm:table-cell">Basis</th>
            <th className="w-14 px-2 py-1.5 text-right font-medium">Qty</th>
            <th className="w-28 px-2 py-1.5 text-right font-medium">Unit cost</th>
            <th className="w-24 px-2 py-1.5 text-right font-medium">Total</th>
            {editable && <th className="w-8" />}
          </tr>
        </thead>
        <tbody className="divide-y">
          {charges.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <td className="px-2 py-1">
                {editable ? (
                  <Input value={c.code ?? ""} onChange={(e) => update(c.id, { code: e.target.value })} className="h-7 px-1.5 font-mono text-xs" />
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                )}
              </td>
              <td className="px-2 py-1">
                {editable ? (
                  <Input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} className="h-7 px-1.5" />
                ) : (
                  c.name
                )}
              </td>
              <td className="hidden px-2 py-1 text-muted-foreground sm:table-cell">{c.basis}</td>
              <td className="px-2 py-1 text-right">
                {editable ? (
                  <Input type="number" value={c.qty} onChange={(e) => update(c.id, { qty: Number(e.target.value) })} className="h-7 px-1.5 text-right tabular-nums" />
                ) : (
                  c.qty
                )}
              </td>
              <td className="px-2 py-1 text-right">
                {editable ? (
                  <Input type="number" value={c.unitCost} onChange={(e) => update(c.id, { unitCost: Number(e.target.value) })} className="h-7 px-1.5 text-right tabular-nums" />
                ) : (
                  money(c.unitCost)
                )}
              </td>
              <td className="px-2 py-1 text-right font-medium tabular-nums">{money(chargeTotal(c))}</td>
              {editable && (
                <td className="px-1 py-1">
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => remove(c.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/30 text-sm font-medium">
            <td colSpan={5} className="px-2 py-1.5 text-right">Service subtotal</td>
            <td className="px-2 py-1.5 text-right tabular-nums">{money(subtotal)}</td>
            {editable && <td />}
          </tr>
        </tfoot>
      </table>
      </div>
      {editable && (
        <button onClick={add} className="flex w-full items-center justify-center gap-1.5 border-t py-1.5 text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
          <Plus className="size-3.5" /> Add charge
        </button>
      )}
    </div>
  );
}
