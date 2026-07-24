"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  MoreHorizontal,
  Check,
  Mail,
  Building2,
  FlaskConical,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  USERS,
  ACCOUNTS,
  PERMISSIONS,
  roleHas,
  type Permission,
} from "@/lib/data";
import { companyById } from "@/lib/auth/companies";
import {
  getRequests, approveRequest, rejectRequest, type AccessRequest, type AccessStatus,
} from "@/lib/auth/access-store";
import { useSession } from "@/components/session-provider";
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

const REQUEST_STATUS_TONE: Record<AccessStatus, StatusTone> = {
  pending: "warning", approved: "info", rejected: "negative", activated: "positive", expired: "neutral", deactivated: "neutral",
};
const REQUEST_STATUS_LABEL: Record<AccessStatus, string> = {
  pending: "Pending", approved: "Approved", rejected: "Rejected", activated: "Activated", expired: "Expired", deactivated: "Deactivated",
};

export default function UsersPage() {
  const { user } = useSession();
  const adminName = user?.name ?? "Administrator";
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("manager");

  const [approveTarget, setApproveTarget] = useState<AccessRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AccessRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => setRequests(getRequests()), []);
  const refresh = () => setRequests(getRequests());

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const activeCount = useMemo(() => ACCOUNTS.filter((a) => a.status === "active").length, []);
  const adminCount = useMemo(() => USERS.filter((u) => u.role === "admin").length, []);

  const grouped = useMemo(
    () => AREAS.map((area) => ({ area, perms: PERMISSIONS.filter((p) => p.area === area) })),
    [],
  );

  function confirmApprove() {
    if (!approveTarget) return;
    approveRequest(approveTarget.id, adminName);
    refresh();
    toast.success(`Approved ${approveTarget.name}`, {
      // Honest: no email provider — the setup email is queued to the dev preview, not delivered.
      description: "Setup email queued to the development preview.",
      action: { label: "View email", onClick: () => window.open("/dev/email-preview", "_blank") },
    });
    setApproveTarget(null);
  }

  function confirmReject() {
    if (!rejectTarget) return;
    rejectRequest(rejectTarget.id, adminName, rejectReason);
    refresh();
    toast(`Rejected ${rejectTarget.name}`, { description: "Rejection email queued to the development preview." });
    setRejectTarget(null);
    setRejectReason("");
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
            value={pendingCount}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Access requests</h2>
              <p className="text-sm text-muted-foreground">
                Closed registration — corporate-domain requests awaiting review.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link href="/dev/email-preview" target="_blank"><FlaskConical className="size-4" /> Email preview (dev)</Link>
            </Button>
          </div>
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No access requests.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-3">
              {[...requests].sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || b.submittedAt.localeCompare(a.submittedAt)).map((reg) => (
                <Card key={reg.id}>
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{reg.name}</span>
                        <StatusBadge tone={REQUEST_STATUS_TONE[reg.status]} dot={false}>{REQUEST_STATUS_LABEL[reg.status]}</StatusBadge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1"><Mail className="size-3.5" />{reg.email}</div>
                        <div className="inline-flex items-center gap-1"><Building2 className="size-3.5" />{companyById(reg.companyId)?.name ?? "—"}</div>
                      </div>
                    </div>
                    <div className="mt-auto space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Submitted</span><span>{fmtDate(reg.submittedAt)}</span>
                      </div>
                      {reg.reviewedAt && (
                        <div className="flex items-center justify-between">
                          <span>Reviewed</span><span>{fmtDate(reg.reviewedAt)}{reg.reviewedBy ? ` · ${reg.reviewedBy}` : ""}</span>
                        </div>
                      )}
                      {reg.status === "pending" ? (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="flex-1" onClick={() => setApproveTarget(reg)}>
                            <Check className="size-4" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => { setRejectTarget(reg); setRejectReason(""); }}>
                            Reject
                          </Button>
                        </div>
                      ) : reg.status === "approved" ? (
                        <p className="rounded-md bg-muted/60 p-2">Awaiting the user to create a password.</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AlertDialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve access request?</AlertDialogTitle>
              <AlertDialogDescription>
                {approveTarget?.name} will receive an email with a secure link to create a password and activate their Atlantic RMS account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmApprove}>Approve and send email</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectReason(""); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject access request?</AlertDialogTitle>
              <AlertDialogDescription>{rejectTarget?.name} will be notified that their request was not approved.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Reason for rejection</Label>
              <Textarea id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} placeholder="Optional" />
              <p className="text-xs text-muted-foreground">This reason may be included in the email if company policy allows it.</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReject} className="bg-destructive text-white hover:bg-destructive/90">Reject request</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
