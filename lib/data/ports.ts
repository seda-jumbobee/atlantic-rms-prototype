import type { Port, AddressPoint, RouteRequirement } from "@/lib/types";

// Route requirements (auto-suggested mandatory services by destination country/port).
// Some have no vendor on the lane → triggers "Request quote with AI".
export const REQUIREMENTS: Record<string, RouteRequirement> = {
  ACID: {
    code: "ACID",
    label: "ACID / Advance Cargo Information",
    reason: "Egypt customs requires an ACID number filed before sailing.",
    hasVendor: true,
    estimatedCost: 120,
  },
  EORI: {
    code: "EORI",
    label: "EORI Registration",
    reason: "EU destinations require an Economic Operators Registration & Identification number.",
    hasVendor: true,
    estimatedCost: 90,
  },
  FUMIGATION: {
    code: "FUMIGATION",
    label: "Fumigation / ISPM-15",
    reason: "Destination requires fumigation of wood packaging — no approved vendor on this lane yet.",
    hasVendor: false,
    estimatedCost: 350,
  },
  NCB: {
    code: "NCB",
    label: "NCB Loading Inspection",
    reason: "Out-of-gauge securing on flat rack must be inspected (only Hapag & Maersk self-certify).",
    hasVendor: true,
    estimatedCost: 280,
  },
};

// Curated port set across the real APC lanes (US/Canada origins + worldwide destinations).
export const PORTS: Port[] = [
  // US / Canada origins
  { id: "p-ushou", locode: "USHOU", name: "Houston", country: "United States", countryCode: "US", lat: 29.75, lng: -95.36, active: true },
  { id: "p-usbal", locode: "USBAL", name: "Baltimore", country: "United States", countryCode: "US", lat: 39.27, lng: -76.58, active: true },
  { id: "p-ussav", locode: "USSAV", name: "Savannah", country: "United States", countryCode: "US", lat: 32.08, lng: -81.09, active: true },
  { id: "p-usnyc", locode: "USNYC", name: "New York / Newark", country: "United States", countryCode: "US", lat: 40.69, lng: -74.18, active: true },
  { id: "p-uslax", locode: "USLAX", name: "Los Angeles / Long Beach", country: "United States", countryCode: "US", lat: 33.74, lng: -118.26, active: true },
  { id: "p-ussea", locode: "USSEA", name: "Seattle / Tacoma", country: "United States", countryCode: "US", lat: 47.6, lng: -122.33, active: true },
  { id: "p-usjax", locode: "USJAX", name: "Jacksonville", country: "United States", countryCode: "US", lat: 30.33, lng: -81.65, active: true },
  { id: "p-usbru", locode: "USBQK", name: "Brunswick", country: "United States", countryCode: "US", lat: 31.15, lng: -81.5, active: true },
  { id: "p-usgal", locode: "USGLS", name: "Galveston / Freeport", country: "United States", countryCode: "US", lat: 29.3, lng: -94.79, active: true },
  { id: "p-camtr", locode: "CAMTR", name: "Montreal", country: "Canada", countryCode: "CA", lat: 45.5, lng: -73.55, active: true },
  // Egypt (forklift US→Egypt example)
  { id: "p-egaly", locode: "EGALY", name: "Alexandria", country: "Egypt", countryCode: "EG", lat: 31.2, lng: 29.92, active: true, requirements: [REQUIREMENTS.ACID, REQUIREMENTS.FUMIGATION] },
  { id: "p-egdam", locode: "EGDAM", name: "Damietta", country: "Egypt", countryCode: "EG", lat: 31.42, lng: 31.81, active: true, requirements: [REQUIREMENTS.ACID] },
  // South America
  { id: "p-clari", locode: "CLARI", name: "Arica", country: "Chile", countryCode: "CL", lat: -18.48, lng: -70.32, active: true },
  { id: "p-pecll", locode: "PECLL", name: "Callao", country: "Peru", countryCode: "PE", lat: -12.05, lng: -77.13, active: true },
  { id: "p-arzae", locode: "ARZAE", name: "Zárate", country: "Argentina", countryCode: "AR", lat: -34.1, lng: -59.03, active: true },
  { id: "p-brssz", locode: "BRSSZ", name: "Santos", country: "Brazil", countryCode: "BR", lat: -23.96, lng: -46.33, active: true },
  { id: "p-uymvd", locode: "UYMVD", name: "Montevideo", country: "Uruguay", countryCode: "UY", lat: -34.9, lng: -56.21, active: true },
  // Europe
  { id: "p-debrv", locode: "DEBRV", name: "Bremerhaven", country: "Germany", countryCode: "DE", lat: 53.54, lng: 8.58, active: true, requirements: [REQUIREMENTS.EORI] },
  { id: "p-deham", locode: "DEHAM", name: "Hamburg", country: "Germany", countryCode: "DE", lat: 53.55, lng: 9.99, active: true, requirements: [REQUIREMENTS.EORI] },
  { id: "p-bernr", locode: "BEANR", name: "Antwerp", country: "Belgium", countryCode: "BE", lat: 51.26, lng: 4.4, active: true, requirements: [REQUIREMENTS.EORI] },
  { id: "p-nlrtm", locode: "NLRTM", name: "Rotterdam", country: "Netherlands", countryCode: "NL", lat: 51.95, lng: 4.14, active: true, requirements: [REQUIREMENTS.EORI] },
  { id: "p-gbsou", locode: "GBSOU", name: "Southampton", country: "United Kingdom", countryCode: "GB", lat: 50.9, lng: -1.4, active: true },
  { id: "p-itgoa", locode: "ITGOA", name: "Genoa", country: "Italy", countryCode: "IT", lat: 44.41, lng: 8.93, active: true, requirements: [REQUIREMENTS.EORI] },
  // Caucasus / CIS (Poti→Baku route)
  { id: "p-gepti", locode: "GEPTI", name: "Poti", country: "Georgia", countryCode: "GE", lat: 42.15, lng: 41.67, active: true },
  { id: "p-gebus", locode: "GEBUS", name: "Batumi", country: "Georgia", countryCode: "GE", lat: 41.65, lng: 41.64, active: true },
  // Middle East
  { id: "p-aedxb", locode: "AEJEA", name: "Jebel Ali", country: "United Arab Emirates", countryCode: "AE", lat: 25.0, lng: 55.06, active: true },
  { id: "p-joaqj", locode: "JOAQJ", name: "Aqaba", country: "Jordan", countryCode: "JO", lat: 29.52, lng: 35.0, active: true },
  // Asia
  { id: "p-cnsha", locode: "CNSHA", name: "Shanghai", country: "China", countryCode: "CN", lat: 31.23, lng: 121.47, active: true },
  { id: "p-cntao", locode: "CNTAO", name: "Qingdao", country: "China", countryCode: "CN", lat: 36.07, lng: 120.38, active: true },
  { id: "p-sgsin", locode: "SGSIN", name: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.26, lng: 103.82, active: true },
  { id: "p-krpus", locode: "KRPUS", name: "Busan", country: "South Korea", countryCode: "KR", lat: 35.1, lng: 129.04, active: true },
  { id: "p-vnsgn", locode: "VNSGN", name: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", lat: 10.77, lng: 106.7, active: true },
  { id: "p-thlch", locode: "THLCH", name: "Laem Chabang", country: "Thailand", countryCode: "TH", lat: 13.08, lng: 100.88, active: true },
  // Oceania (fumigation country)
  { id: "p-aubne", locode: "AUBNE", name: "Brisbane", country: "Australia", countryCode: "AU", lat: -27.38, lng: 153.17, active: true, requirements: [REQUIREMENTS.FUMIGATION] },
  { id: "p-ausyd", locode: "AUSYD", name: "Sydney", country: "Australia", countryCode: "AU", lat: -33.85, lng: 151.23, active: true, requirements: [REQUIREMENTS.FUMIGATION] },
  { id: "p-aumel", locode: "AUMEL", name: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.84, lng: 144.93, active: true, requirements: [REQUIREMENTS.FUMIGATION] },
];

export function getPort(id?: string): Port | undefined {
  return id ? PORTS.find((p) => p.id === id) : undefined;
}
export function findPortByLocode(locode: string): Port | undefined {
  return PORTS.find((p) => p.locode.toLowerCase() === locode.toLowerCase());
}

// Sample door addresses for door-to-door quoting (origin pickup / destination delivery).
export const ADDRESSES: AddressPoint[] = [
  { id: "a-charleston", label: "1450 County Rd 9, Charleston, IL 61920", city: "Charleston", state: "IL", country: "United States", countryCode: "US", zip: "61920", lat: 39.5, lng: -88.17, nearestCfsId: "cfs-4", milesToCfs: 12 },
  { id: "a-fargo", label: "3201 39th St SW, Fargo, ND 58104", city: "Fargo", state: "ND", country: "United States", countryCode: "US", zip: "58104", lat: 46.81, lng: -96.86, nearestCfsId: "cfs-3", milesToCfs: 28 },
  { id: "a-grandisland", label: "905 Allen Dr, Grand Island, NE 68803", city: "Grand Island", state: "NE", country: "United States", countryCode: "US", zip: "68803", lat: 40.92, lng: -98.34, nearestCfsId: "cfs-3", milesToCfs: 410 },
  { id: "a-cairo", label: "Industrial Zone, 6th of October City, Giza", city: "Cairo", country: "Egypt", countryCode: "EG", lat: 29.94, lng: 30.93 },
  { id: "a-baku", label: "Heydar Aliyev Ave 152, Baku AZ1029", city: "Baku", country: "Azerbaijan", countryCode: "AZ", lat: 40.41, lng: 49.87 },
  { id: "a-berlin", label: "Karl-Liebknecht-Str. 5, 10178 Berlin", city: "Berlin", country: "Germany", countryCode: "DE", zip: "10178", lat: 52.52, lng: 13.41 },
];

export function getAddress(id?: string): AddressPoint | undefined {
  return id ? ADDRESSES.find((a) => a.id === id) : undefined;
}
