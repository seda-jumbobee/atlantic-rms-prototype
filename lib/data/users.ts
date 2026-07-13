import type { User } from "@/lib/types";

// Sales team + procurement, drawn from Kommo "Lead resp. user" + Customer Matrix sheets.
export const USERS: User[] = [
  {
    id: "u-max",
    name: "Max Mayer",
    email: "max.mayer@atlanticprojectcargo.com",
    role: "admin",
    title: "Procurement Manager",
    initials: "MM",
    avatarColor: "#0ea5b7",
  },
  {
    id: "u-mariana",
    name: "Mariana Koval",
    email: "mariana@atlanticprojectcargo.com",
    role: "admin",
    title: "Owner / Pricing",
    initials: "MK",
    avatarColor: "#7c3aed",
  },
  {
    id: "u-nick",
    name: "Nickolay Yadryshnikov",
    email: "nick@atlanticprojectcargo.com",
    role: "manager",
    title: "Sales Manager",
    initials: "NY",
    avatarColor: "#2563eb",
  },
  {
    id: "u-vasily",
    name: "Vasily Lugovoy",
    email: "vasily@atlanticprojectcargo.com",
    role: "manager",
    title: "Sales Manager",
    initials: "VL",
    avatarColor: "#16a34a",
  },
  {
    id: "u-will",
    name: "Will Lugovoy",
    email: "will@atlanticprojectcargo.com",
    role: "manager",
    title: "Sales Manager",
    initials: "WL",
    avatarColor: "#ea580c",
  },
  {
    id: "u-vitaly",
    name: "Vitaliy Romanenko",
    email: "vitaliy@atlanticprojectcargo.com",
    role: "manager",
    title: "Sales Manager",
    initials: "VR",
    avatarColor: "#db2777",
  },
];

export const DEFAULT_MANAGER = USERS.find((u) => u.id === "u-nick")!;
export const DEFAULT_ADMIN = USERS.find((u) => u.id === "u-max")!;

export function getUser(id?: string): User | undefined {
  return id ? USERS.find((u) => u.id === id) : undefined;
}

// Corporate domains allowed to register (closed registration).
export const ALLOWED_EMAIL_DOMAINS = [
  "jumbobee.com",
  "atlanticprojectcargo.com",
  "atlanticexpresscorp.com",
];

export function isCorporateEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}
