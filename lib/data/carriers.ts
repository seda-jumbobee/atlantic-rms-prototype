import type { Carrier } from "@/lib/types";

// Ocean carriers from the OPS rate matrix + All-materials catalogue + Wisor results.
export const CARRIERS: Carrier[] = [
  { id: "c-maersk", code: "MAERSK", name: "Maersk Line", color: "#42b0d5", monogram: "MA", offersNcb: true, hasApi: true, portalUrl: "https://www.maersk.com/book/" },
  { id: "c-msc", code: "MSC", name: "Mediterranean Shipping Co.", color: "#022f6c", monogram: "MSC", hasApi: true, portalUrl: "https://www.mymsc.com/mymsc/" },
  { id: "c-cma", code: "CMA", name: "CMA CGM", color: "#003d7d", monogram: "CMA", hasApi: true, portalUrl: "https://www.cma-cgm.com/ebusiness/pricing/instant-Quoting" },
  { id: "c-hapag", code: "HAPAG", name: "Hapag-Lloyd", color: "#ee7203", monogram: "HL", offersNcb: true, hasApi: true, portalUrl: "https://www.hapag-lloyd.com/solutions/new-quote/" },
  { id: "c-one", code: "ONE", name: "Ocean Network Express", color: "#bf1e8e", monogram: "ONE", hasApi: true, portalUrl: "https://eua.one-line.com/" },
  { id: "c-yml", code: "YML", name: "Yang Ming Marine Transport", color: "#00833e", monogram: "YML", portalUrl: "https://www.yangming.com/" },
  { id: "c-oocl", code: "OOCL", name: "OOCL", color: "#d81e05", monogram: "OO", hasApi: true, portalUrl: "https://moc.oocl.com/" },
  { id: "c-cosco", code: "COSCO", name: "COSCO Shipping", color: "#003da5", monogram: "CO", hasApi: true, portalUrl: "https://lines.coscoshipping.com/home" },
  { id: "c-zim", code: "ZIM", name: "ZIM Integrated Shipping", color: "#0b3d91", monogram: "ZIM", hasApi: true, portalUrl: "https://www.ezquote.zim.com/dashboard" },
  { id: "c-evergreen", code: "EVERGREEN", name: "Evergreen Marine", color: "#00843d", monogram: "EV" },
  { id: "c-hmm", code: "HMM", name: "HMM (Hyundai Merchant Marine)", color: "#00529b", monogram: "HMM", hasApi: true },
  { id: "c-kline", code: "KLINE", name: "“K” Line (RoRo)", color: "#c8102e", monogram: "KL" },
  { id: "c-nyk", code: "NYK", name: "NYK Line (RoRo)", color: "#003594", monogram: "NYK" },
  { id: "c-hoegh", code: "HOEGH", name: "Höegh Autoliners (RoRo)", color: "#0a4a7a", monogram: "HA" },
  { id: "c-qatar", code: "QATAR", name: "Qatar Airways Cargo (Air)", color: "#5c0632", monogram: "QR" },
];

export function getCarrier(id?: string): Carrier | undefined {
  return id ? CARRIERS.find((c) => c.id === id) : undefined;
}
