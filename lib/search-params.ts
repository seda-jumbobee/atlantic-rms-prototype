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
  };
}
