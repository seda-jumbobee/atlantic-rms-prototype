import type { Role } from "@/lib/types";
import { USERS } from "./users";

export type AccountStatus = "active" | "pending" | "disabled";

export interface Account {
  userId: string;
  status: AccountStatus;
  lastActive?: string;
}

// Permission catalog grouped by area; admin (Procurement) has all, manager a subset.
export interface Permission {
  key: string;
  label: string;
  area: "Quotes" | "Rates & Vendors" | "Deals & CRM" | "Admin";
}

export const PERMISSIONS: Permission[] = [
  { key: "quote.create", label: "Create & send quotes", area: "Quotes" },
  { key: "quote.history", label: "View quote history", area: "Quotes" },
  { key: "route.build", label: "Build routes", area: "Quotes" },
  { key: "rate.view", label: "View rates", area: "Rates & Vendors" },
  { key: "rate.edit", label: "Add / edit / delete rates", area: "Rates & Vendors" },
  { key: "rate.bulk", label: "Bulk-upload contracts", area: "Rates & Vendors" },
  { key: "vendor.view", label: "View vendors", area: "Rates & Vendors" },
  { key: "vendor.manage", label: "Manage vendors", area: "Rates & Vendors" },
  { key: "front.review", label: "Review Front-imported rates", area: "Rates & Vendors" },
  { key: "deal.view", label: "View deals (sale)", area: "Deals & CRM" },
  { key: "deal.finance", label: "View cost / margin / commission", area: "Deals & CRM" },
  { key: "deal.invoice", label: "Invoice reconciliation", area: "Deals & CRM" },
  { key: "admin.users", label: "Manage users & permissions", area: "Admin" },
  { key: "admin.integrations", label: "Manage integrations", area: "Admin" },
  { key: "admin.logs", label: "View request logs", area: "Admin" },
];

// Default permissions per role.
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  manager: ["quote.create", "quote.history", "route.build", "rate.view", "vendor.view", "deal.view"],
  admin: PERMISSIONS.map((p) => p.key), // Procurement Manager = everything
};

export function roleHas(role: Role, key: string): boolean {
  return ROLE_PERMISSIONS[role].includes(key);
}

export const ACCOUNTS: Account[] = USERS.map((u, i) => ({
  userId: u.id,
  status: "active",
  lastActive: ["2026-06-23T11:52:00Z", "2026-06-23T09:10:00Z", "2026-06-23T10:42:00Z", "2026-06-23T11:55:00Z", "2026-06-22T16:30:00Z", "2026-06-23T07:20:00Z"][i] ?? "2026-06-20T00:00:00Z",
}));

export interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  company: string;
  requestedRole: Role;
  requestedAt: string;
  emailConfirmed: boolean;
}

export const PENDING_REGISTRATIONS: PendingRegistration[] = [
  { id: "pr-1", name: "Dilara Aydın", email: "dilara@atlanticprojectcargo.com", company: "Atlantic Project Cargo", requestedRole: "manager", requestedAt: "2026-06-23T08:05:00Z", emailConfirmed: true },
  { id: "pr-2", name: "Paul Henderson", email: "paul@jumbobee.com", company: "JumboBee", requestedRole: "manager", requestedAt: "2026-06-22T17:40:00Z", emailConfirmed: true },
  { id: "pr-3", name: "Olena Kovalenko", email: "olena@atlanticexpresscorp.com", company: "Atlantic Express Corp", requestedRole: "manager", requestedAt: "2026-06-23T09:55:00Z", emailConfirmed: false },
];
