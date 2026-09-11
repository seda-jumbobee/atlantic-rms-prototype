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
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin-gate";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ManagerAvatar } from "@/components/deals/manager-avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldHelper, FieldLabel, TextField } from "@/components/ui/field";
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
import type { Role, User } from "@/lib/types";
import { fmtDate, relativeAge } from "@/lib/format";
import { StatusBadge, type StatusTone } from "@/components/status-badge";

const ROLE_LABEL: Record<Role, string> = { manager: "Sales Manager", admin: "Procurement (Admin)" };

/** A role is a classification, not a judgement, so it rides the same five-tone
    scale as every other chip: info for the elevated one, neutral for the rest.
    A solid brand-filled badge here competed with the page's real primary action. */
const ROLE_TONE: Record<Role, StatusTone> = { admin: "info", manager: "neutral" };

const STATUS_TONE: Record<string, StatusTone> = {
  active: "positive",
  pending: "warning",
  disabled: "neutral",
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <StatusBadge tone={ROLE_TONE[role]} dot={false}>
      {ROLE_LABEL[role]}
    </StatusBadge>
  );
}

const AREAS: Permission["area"][] = ["Quotes", "Rates & Vendors", "Deals & CRM", "Admin"];

const REQUEST_STATUS_TONE: Record<AccessStatus, StatusTone> = {
  pending: "warning", approved: "info", rejected: "negative", activated: "positive", expired: "neutral", deactivated: "neutral",
};
const REQUEST_STATUS_LABEL: Record<AccessStatus, string> = {
  pending: "Pending", approved: "Approved", rejected: "Rejected", activated: "Activated", expired: "Expired", deactivated: "Deactivated",
};

/* ── Section shell ────────────────────────────────────────────────────────
   The card a table lives in. py-5 matches the 20px the table's edge cells
   inset by, so the heading, the rows below it and the card's own edges all
   agree on one column. The heading is a real <h2> naming the section, which
   a CardTitle div cannot be.                                             */
function TableSection({
  id, title, description, children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card asChild className="gap-4 p-0 py-5">
      <section aria-labelledby={id}>
        <div className="flex flex-col gap-1 px-5">
          <h2 id={id} className="text-h4 text-foreground">{title}</h2>
          <p className="text-body text-muted-foreground">{description}</p>
        </div>
        {children}
      </section>
    </Card>
  );
}

/** One label/value pair in the stacked presentation the Team list falls back
    to below lg. */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body text-foreground">{children}</dd>
    </>
  );
}

/** The per-account menu. Rendered by both the table row and the stacked card,
    so the two presentations cannot offer different actions. Nothing here is
    persisted — this prototype has no backend — and the toasts say so. */
function UserActions({
  user, triggerSize = "icon-sm",
}: {
  user: User;
  triggerSize?: "icon-sm" | "icon";
}) {
  const otherRole = user.role === "admin" ? ROLE_LABEL.manager : ROLE_LABEL.admin;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={triggerSize} aria-label={`Actions for ${user.name}`}>
          <MoreHorizontal aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            toast("Role change prepared", {
              description: `${user.name} → ${otherRole} — nothing is saved in this development preview.`,
            })
          }
        >
          Change role
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            toast("Account disable prepared", {
              description: `${user.email} — nothing is saved in this development preview.`,
            })
          }
        >
          Disable account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Name over email, beside the shared initials chip — the same chip the deals
    tables use for the same people. */
function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ManagerAvatar user={user} size="md" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body font-medium text-foreground">{user.name}</span>
        <span className="truncate text-caption text-muted-foreground">{user.email}</span>
      </div>
    </div>
  );
}

/** A tick or a dash is colour and shape only, so each carries its own word for
    anyone reading the matrix through assistive tech. */
function PermissionMark({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <>
      <Check aria-hidden className="mx-auto size-4 text-status-positive-fg" />
      <span className="sr-only">Allowed</span>
    </>
  ) : (
    <>
      <span aria-hidden className="text-muted-foreground">—</span>
      <span className="sr-only">Not allowed</span>
    </>
  );
}

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
    // Honest: no email provider is configured, so nothing is actually delivered.
    toast.success("Invitation prepared", { description: `${inviteEmail.trim()} · ${ROLE_LABEL[inviteRole]} — no email is sent in this development preview.` });
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("manager");
  }

  const sortedRequests = [...requests].sort(
    (a, b) =>
      (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) ||
      b.submittedAt.localeCompare(a.submittedAt),
  );

  return (
    <AdminGate>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Users & Permissions"
          description="Manage who can access the RMS, their roles, and pending registrations."
        >
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus aria-hidden className="size-4" />
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
              {/* Two fields side by side: the modal is one fixed width, and
                  stacking two short controls down 800px wastes all of it. */}
              <div className="grid gap-4 py-1 sm:grid-cols-2">
                <TextField
                  id="invite-email"
                  label="Email address"
                  type="email"
                  required
                  placeholder="name@atlanticprojectcargo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Field>
                  <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                    <SelectTrigger id="invite-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">{ROLE_LABEL.manager}</SelectItem>
                      <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendInvite}>
                  <Mail aria-hidden className="size-4" />
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

        <TableSection
          id="team-heading"
          title="Team"
          description="All RMS accounts and their access level."
        >
          {/* xl, not md: the sidebar appears at 768 and takes 256px of it, so
              the content column only reaches these six columns' natural 846px
              at 1280. Below that the table would scroll sideways inside its
              card — measured, not guessed — and the same fields stack instead,
              which beats capping the User column until a name truncates. */}
          <div className="hidden xl:block">
            <Table plain>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {USERS.map((u) => {
                  const acct = ACCOUNTS.find((a) => a.userId === u.id);
                  const status = acct?.status ?? "active";
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <UserIdentity user={u} />
                      </TableCell>
                      <TableCell className="text-body text-muted-foreground">{u.title}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={STATUS_TONE[status] ?? "neutral"} className="capitalize">
                          {status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-body text-muted-foreground">
                        {acct?.lastActive ? (
                          <span title={fmtDate(acct.lastActive)}>{relativeAge(acct.lastActive)}</span>
                        ) : (
                          <>
                            <span aria-hidden>—</span>
                            <span className="sr-only">never</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <UserActions user={u} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <ul className="xl:hidden">
            {USERS.map((u) => {
              const acct = ACCOUNTS.find((a) => a.userId === u.id);
              const status = acct?.status ?? "active";
              return (
                <li
                  key={u.id}
                  className="flex flex-col gap-3 border-b border-[var(--c-table-border)] px-5 py-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <UserIdentity user={u} />
                    {/* 44px here: on a touch screen this is the only way into
                        the account's actions. */}
                    <UserActions user={u} triggerSize="icon" />
                  </div>
                  {/* Two pairs per line once there is room, so a laptop-width
                      entry is four short rows rather than a tall sparse column. */}
                  <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-x-6">
                    <Cell label="Title">{u.title}</Cell>
                    <Cell label="Role"><RoleBadge role={u.role} /></Cell>
                    <Cell label="Status">
                      <StatusBadge tone={STATUS_TONE[status] ?? "neutral"} className="capitalize">
                        {status}
                      </StatusBadge>
                    </Cell>
                    <Cell label="Last active">
                      {acct?.lastActive ? relativeAge(acct.lastActive) : "Never"}
                    </Cell>
                  </dl>
                </li>
              );
            })}
          </ul>
        </TableSection>

        <section aria-labelledby="access-requests-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="access-requests-heading" className="text-h4 text-foreground">Access requests</h2>
              <p className="text-body text-muted-foreground">
                Closed registration — corporate-domain requests awaiting review.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dev/email-preview" target="_blank" rel="noreferrer">
                <FlaskConical aria-hidden className="size-4" /> Email preview (dev)
              </Link>
            </Button>
          </div>
          {sortedRequests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No access requests"
              description="Registrations from a corporate domain land here for review."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedRequests.map((reg) => (
                <Card key={reg.id} className="gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate text-body font-medium text-foreground">{reg.name}</span>
                    <StatusBadge tone={REQUEST_STATUS_TONE[reg.status]} dot={false}>
                      {REQUEST_STATUS_LABEL[reg.status]}
                    </StatusBadge>
                  </div>
                  <div className="flex flex-col gap-1 text-caption text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Mail aria-hidden className="size-3.5 shrink-0" />
                      <span className="truncate">{reg.email}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Building2 aria-hidden className="size-3.5 shrink-0" />
                      <span className="truncate">{companyById(reg.companyId)?.name ?? "—"}</span>
                    </span>
                  </div>
                  {/* mt-auto: the cards in a row are stretched to the tallest,
                      so the dates and the actions line up across the row. */}
                  <dl className="mt-auto flex flex-col gap-1 text-caption">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd className="text-foreground">{fmtDate(reg.submittedAt)}</dd>
                    </div>
                    {reg.reviewedAt && (
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-muted-foreground">Reviewed</dt>
                        <dd className="text-right text-foreground">
                          {fmtDate(reg.reviewedAt)}{reg.reviewedBy ? ` · ${reg.reviewedBy}` : ""}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {reg.status === "pending" ? (
                    // Full-height controls on a phone, compact on desktop: these
                    // are the card's whole purpose and the only tap target in it.
                    <div className="flex gap-2">
                      <Button size="sm" className="h-11 flex-1 sm:h-8" onClick={() => setApproveTarget(reg)}>
                        <Check aria-hidden className="size-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-11 flex-1 sm:h-8"
                        onClick={() => { setRejectTarget(reg); setRejectReason(""); }}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : reg.status === "approved" ? (
                    <p className="rounded-md bg-muted p-2 text-caption text-muted-foreground">
                      Awaiting the user to create a password.
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </section>

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
            <Field>
              <FieldLabel htmlFor="reject-reason">Reason for rejection</FieldLabel>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="Optional"
                aria-describedby="reject-reason-helper"
              />
              <FieldHelper id="reject-reason-helper">
                This reason may be included in the email if company policy allows it.
              </FieldHelper>
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmReject}>Reject request</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TableSection
          id="permissions-heading"
          title="Permission matrix"
          description="What each role can do, grouped by area. Read-only — Admin (Procurement) has full access."
        >
          {/* compact: fifteen rows of the same two marks, read down a column
              rather than a row at a time. */}
          <Table plain density="compact">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Permission</TableHead>
                <TableHead className="text-center">{ROLE_LABEL.manager}</TableHead>
                <TableHead className="text-center">{ROLE_LABEL.admin}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map(({ area, perms }) => (
                <Fragment key={area}>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableCell colSpan={3} className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
                      {area}
                    </TableCell>
                  </TableRow>
                  {perms.map((p) => (
                    <TableRow key={p.key}>
                      <TableCell className="text-body">{p.label}</TableCell>
                      <TableCell className="text-center">
                        <PermissionMark allowed={roleHas("manager", p.key)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <PermissionMark allowed={roleHas("admin", p.key)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableSection>
      </div>
    </AdminGate>
  );
}
