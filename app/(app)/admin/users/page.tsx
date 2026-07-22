"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  MoreHorizontal,
  Check,
  Mail,
  Building2,
  MailCheck,
  MailX,
} from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  USERS,
  ACCOUNTS,
  PERMISSIONS,
  PENDING_REGISTRATIONS,
  roleHas,
  type PendingRegistration,
  type Permission,
} from "@/lib/data";
import type { Role } from "@/lib/types";
import { fmtDate, relativeAge } from "@/lib/format";
import { StatusBadge, type StatusTone } from "@/components/status-badge";

const ROLE_LABEL: Record<Role, string> = { manager: "Sales Manager", admin: "Procurement (Admin)" };

const STATUS_TONE: Record<string, StatusTone> = {
  active: "positive",
  pending: "warning",
  disabled: "neutral",
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant={role === "admin" ? "default" : "secondary"}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}

const AREAS: Permission["area"][] = ["Quotes", "Rates & Vendors", "Deals & CRM", "Admin"];

export default function UsersPage() {
  const [pending, setPending] = useState<PendingRegistration[]>(PENDING_REGISTRATIONS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("manager");

  const activeCount = useMemo(() => ACCOUNTS.filter((a) => a.status === "active").length, []);
  const adminCount = useMemo(() => USERS.filter((u) => u.role === "admin").length, []);

  const grouped = useMemo(
    () => AREAS.map((area) => ({ area, perms: PERMISSIONS.filter((p) => p.area === area) })),
    [],
  );

  function approve(reg: PendingRegistration) {
    setPending((p) => p.filter((r) => r.id !== reg.id));
    toast.success(`Approved ${reg.name}`, { description: `${reg.email} can now sign in as ${ROLE_LABEL[reg.requestedRole]}.` });
  }

  function reject(reg: PendingRegistration) {
    setPending((p) => p.filter((r) => r.id !== reg.id));
    toast(`Rejected ${reg.name}`, { description: reg.email });
  }

  function sendInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }
    toast.success("Invitation sent", { description: `${inviteEmail.trim()} invited as ${ROLE_LABEL[inviteRole]}.` });
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("manager");
  }

  return (
    <AdminGate>
      <div className="space-y-6">
        <PageHeader
          title="Users & Permissions"
          description="Manage who can access the RMS, their roles, and pending registrations."
        >
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="size-4" />
                Invite user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a user</DialogTitle>
                <DialogDescription>
                  Send an email invitation. Only corporate domains can register.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@atlanticprojectcargo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">{ROLE_LABEL.manager}</SelectItem>
                      <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendInvite}>
                  <Mail className="size-4" />
                  Send invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Active users" value={activeCount} icon={Users} accent="success" />
          <StatCard
            label="Pending approvals"
            value={pending.length}
            sub="awaiting review"
            icon={Clock}
            accent="warning"
          />
          <StatCard label="Admins" value={adminCount} sub="Procurement access" icon={ShieldCheck} accent="primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
            <CardDescription>All RMS accounts and their access level.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {USERS.map((u) => {
                  const acct = ACCOUNTS.find((a) => a.userId === u.id);
                  const status = acct?.status ?? "active";
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: u.avatarColor }}
                          >
                            {u.initials}
                          </span>
                          <div className="space-y-0.5">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.title}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={STATUS_TONE[status] ?? "neutral"} className="capitalize">
                          {status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {acct?.lastActive ? relativeAge(acct.lastActive) : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{u.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                toast.success("Role updated", {
                                  description: `${u.name} → ${u.role === "admin" ? ROLE_LABEL.manager : ROLE_LABEL.admin}`,
                                })
                              }
                            >
                              Change role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => toast(`Disabled ${u.name}`, { description: u.email })}
                            >
                              Disable account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Pending registrations</h2>
            <p className="text-sm text-muted-foreground">
              Closed registration — corporate-domain sign-ups awaiting approval.
            </p>
          </div>
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No pending registrations.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-3">
              {pending.map((reg) => (
                <Card key={reg.id}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{reg.name}</span>
                        {reg.emailConfirmed ? (
                          <Badge variant="status-positive">
                            <MailCheck className="size-3.5" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge variant="status-warning">
                            <MailX className="size-3.5" />
                            Unconfirmed
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1">
                          <Mail className="size-3.5" />
                          {reg.email}
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <Building2 className="size-3.5" />
                          {reg.company}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <RoleBadge role={reg.requestedRole} />
                      <span className="text-muted-foreground">{fmtDate(reg.requestedAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => approve(reg)}>
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => reject(reg)}>
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permission matrix</CardTitle>
            <CardDescription>
              What each role can do, grouped by area. Read-only — Admin (Procurement) has full access.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  <TableHead className="text-center">{ROLE_LABEL.manager}</TableHead>
                  <TableHead className="text-center">{ROLE_LABEL.admin}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map(({ area, perms }) => (
                  <Fragment key={area}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={3} className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {area}
                      </TableCell>
                    </TableRow>
                    {perms.map((p) => (
                      <TableRow key={p.key}>
                        <TableCell className="text-sm">{p.label}</TableCell>
                        <TableCell className="text-center">
                          {roleHas("manager", p.key) ? (
                            <Check className="mx-auto size-4 text-success" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {roleHas("admin", p.key) ? (
                            <Check className="mx-auto size-4 text-success" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
