import type { SearchInput } from "@/lib/quote-engine";
import type { CommodityKind, ShipmentType, ContainerCode } from "@/lib/types";

export function encodeSearch(input: SearchInput): string {
  const p = new URLSearchParams();
  if (input.originPortId) p.set("op", input.originPortId);
  if (input.originAddressId) p.set("oa", input.originAddressId);
  if (input.destPortId) p.set("dp", input.destPortId);
  if (input.destAddressId) p.set("da", input.destAddressId);
  if (input.equipmentId) p.set("eq", input.equipmentId);
  p.set("ck", input.commodityKind);
  p.set("cl", input.commodityLabel);
  p.set("st", input.shipmentType);
  if (input.container) p.set("ct", input.container);
  if (input.advancedSearch) p.set("adv", "1");
  if (input.loadingDate) p.set("ld", input.loadingDate);
  // display-only round-trip fields (ignored by older links)
  if (input.condition === "inoperable") p.set("cond", "n");
  const d = input.dimensions;
  if (d && (d.lengthIn || d.widthIn || d.heightIn || d.weightLb)) {
    if (d.lengthIn) p.set("dl", String(d.lengthIn));
    if (d.widthIn) p.set("dw", String(d.widthIn));
    if (d.heightIn) p.set("dh", String(d.heightIn));
    if (d.weightLb) p.set("dwt", String(d.weightLb));
  }
  return p.toString();
}

export function decodeSearch(sp: URLSearchParams | Record<string, string | undefined>): SearchInput | null {
  const get = (k: string) =>
    sp instanceof URLSearchParams ? sp.get(k) ?? undefined : sp[k];
  const ck = get("ck") as CommodityKind | undefined;
  const st = get("st") as ShipmentType | undefined;
  if (!ck || !st) return null;
  if (!get("op") && !get("oa")) return null;
  if (!get("dp") && !get("da")) return null;
  const num = (k: string) => {
    const n = Number(get(k));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const hasDims = ["dl", "dw", "dh", "dwt"].some((k) => get(k));
  return {
    originPortId: get("op"),
    originAddressId: get("oa"),
    destPortId: get("dp"),
    destAddressId: get("da"),
    equipmentId: get("eq"),
    commodityKind: ck,
    commodityLabel: get("cl") ?? "",
    shipmentType: st,
    container: get("ct") as ContainerCode | undefined,
    advancedSearch: get("adv") === "1",
    loadingDate: get("ld"),
    condition: get("cond") === "n" ? "inoperable" : undefined,
    dimensions: hasDims
      ? { lengthIn: num("dl"), widthIn: num("dw"), heightIn: num("dh"), weightLb: num("dwt") }
      : undefined,
  };
}
