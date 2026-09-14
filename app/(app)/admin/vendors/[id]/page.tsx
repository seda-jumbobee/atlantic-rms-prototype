"use client";

import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { AlertCircle, Check, Pencil, Star } from "lucide-react";
import { toast } from "sonner";

import { AdminGate } from "@/components/admin-gate";
import { DetailShell, DetailSection, DetailGrid, DetailItem } from "@/components/detail-shell";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldLabel, FieldError, FieldHelper, TextField } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SERVICE_LABEL, TIER_GUIDE, VENDOR_SERVICES, VENDOR_TIERS, getVendor } from "@/lib/data/vendors";
import { dataSourcesForVendor } from "@/lib/data/vendors";
import { saveVendor, useVendor, useIsEdited, type VendorPatch } from "@/lib/vendor-overrides";
import type { Coast, DataSourceStatus, VendorServiceKind, VendorTier } from "@/lib/types";

/* ============================================================================
   Vendor detail — the admin's management workflow for one vendor.

   View and edit are the same page in two modes rather than two screens, so the
   record never moves under the reader when they start editing.

   THERE IS NO VENDOR ENDPOINT. Saving applies the change through
   lib/vendor-overrides, which holds it in memory for the session: the edit is
   real everywhere the vendor appears, and it is gone on reload because it was
   never sent anywhere. The save confirmation says exactly that instead of
   reporting a write that did not happen.
   ========================================================================= */

const TIER_TONE: Record<VendorTier, StatusTone> = { 1: "positive", 2: "info", 3: "neutral" };
const COASTS: Coast[] = ["East", "West", "Gulf", "Inland", "Intl"];

/* A source's state reuses the product's status scale rather than inventing a
   second vocabulary for the same five values. */
const SOURCE_TONE: Record<DataSourceStatus, StatusTone> = {
  actual: "positive",
  on_review: "warning",
  in_edits: "info",
  additional: "neutral",
  old: "neutral",
};
const SOURCE_STATUS_LABEL: Record<DataSourceStatus, string> = {
  actual: "Actual",
  on_review: "On review",
  in_edits: "In edits",
  additional: "Additional",
  old: "Old",
};

type Draft = {
  name: string;
  tier: VendorTier;
  coast: Coast;
  baseLocation: string;
  rating: string;
  services: VendorServiceKind[];
  ownsEquipment: boolean;
  contactEmail: string;
  contactPhone: string;
  notes: string;
};

type Errors = Partial<Record<"name" | "baseLocation" | "rating" | "services" | "contactEmail", string>>;

function validate(d: Draft): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Enter the vendor's name.";
  if (!d.baseLocation.trim()) e.baseLocation = "Enter where this vendor is based.";
  const r = Number(d.rating);
  if (!d.rating.trim() || Number.isNaN(r) || r < 1 || r > 5) e.rating = "Rating must be between 1 and 5.";
  if (!d.services.length) e.services = "Select at least one service.";
  // Deliberately permissive: enough to catch a typo, not a spec-complete
  // address grammar that would reject valid corporate mailboxes.
  if (d.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contactEmail.trim())) {
    e.contactEmail = "Enter a valid email address.";
  }
  return e;
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star aria-hidden className="size-4 fill-status-warning-fg text-status-warning-fg" />
      {value.toFixed(1)}
      <span className="sr-only">out of 5</span>
    </span>
  );
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  if (!getVendor(id)) notFound();

  return (
    <AdminGate>
      <VendorDetail id={id} />
    </AdminGate>
  );
}

function VendorDetail({ id }: { id: string }) {
  const vendor = useVendor(id);
  const edited = useIsEdited(id);
  const sources = useMemo(() => dataSourcesForVendor(id), [id]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmTier, setConfirmTier] = useState(false);

  if (!vendor) notFound();

  function startEdit() {
    setDraft({
      name: vendor!.name,
      tier: vendor!.tier,
      coast: vendor!.coast,
      baseLocation: vendor!.baseLocation,
      rating: String(vendor!.rating),
      services: [...vendor!.services],
      ownsEquipment: vendor!.ownsEquipment,
      contactEmail: vendor!.contactEmail ?? "",
      contactPhone: vendor!.contactPhone ?? "",
      notes: vendor!.notes ?? "",
    });
    setErrors({});
    setFormError(null);
    setEditing(true);
  }

  function cancel() {
    // The draft is dropped, not written back — Cancel means cancel.
    setEditing(false);
    setDraft(null);
    setErrors({});
    setFormError(null);
  }

  function attemptSave() {
    if (!draft) return;
    const e = validate(draft);
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    // A tier move changes which lanes this vendor is offered for, so it is
    // confirmed before it is applied rather than after.
    if (draft.tier !== vendor!.tier) {
      setConfirmTier(true);
      return;
    }
    commit();
  }

  function commit() {
    if (!draft) return;
    setConfirmTier(false);
    setSaving(true);

    const patch: VendorPatch = {
      name: draft.name.trim(),
      tier: draft.tier,
      baseLocation: draft.baseLocation.trim(),
      rating: Number(draft.rating),
      services: draft.services,
      ownsEquipment: draft.ownsEquipment,
      contactEmail: draft.contactEmail.trim() || undefined,
      contactPhone: draft.contactPhone.trim() || undefined,
      notes: draft.notes.trim() || undefined,
    };

    const res = saveVendor(id, patch);
    setSaving(false);

    if (!res.ok) {
      // The draft is kept, so nothing the admin typed is lost to a failure.
      setFormError(res.message);
      return;
    }
    setEditing(false);
    setDraft(null);
    toast.success("Vendor updated", {
      description: "Applied for this session — there is no vendor endpoint to write it to yet.",
    });
  }

  const toggleService = (s: VendorServiceKind) =>
    setDraft((d) =>
      d ? { ...d, services: d.services.includes(s) ? d.services.filter((x) => x !== s) : [...d.services, s] } : d,
    );

  return (
    <DetailShell
      backHref="/admin/vendors"
      backLabel="Back to vendors"
      title={vendor.name}
      status={
        <>
          <StatusBadge tone={TIER_TONE[vendor.tier]} dot={false}>Tier {vendor.tier}</StatusBadge>
          {edited && (
            <StatusBadge tone="warning" dot={false}>Edited this session</StatusBadge>
          )}
        </>
      }
      subtitle={`${vendor.baseLocation} · ${vendor.coast} coast`}
      actions={
        editing ? (
          <>
            <Button variant="outline" onClick={cancel} disabled={saving}>Cancel</Button>
            <Button onClick={attemptSave} loading={saving} loadingText="Saving…">
              <Check className="size-4" /> Save changes
            </Button>
          </>
        ) : (
          <Button onClick={startEdit}>
            <Pencil className="size-4" /> Edit vendor
          </Button>
        )
      }
    >
      {formError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {editing && draft ? (
        <DetailSection title="Vendor information" description="Changes apply when you save.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Vendor name"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              error={errors.name}
            />
            <TextField
              label="Based in"
              required
              value={draft.baseLocation}
              onChange={(e) => setDraft({ ...draft, baseLocation: e.target.value })}
              error={errors.baseLocation}
            />

            <Field>
              <FieldLabel htmlFor="v-tier" required>Tier</FieldLabel>
              <Select
                value={String(draft.tier)}
                onValueChange={(v) => setDraft({ ...draft, tier: Number(v) as VendorTier })}
              >
                <SelectTrigger id="v-tier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_TIERS.map((t) => (
                    <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHelper id="v-tier-help">
                {TIER_GUIDE.find((g) => g.tier === draft.tier)?.title}
              </FieldHelper>
            </Field>

            <Field>
              <FieldLabel htmlFor="v-coast" required>Coast</FieldLabel>
              <Select value={draft.coast} onValueChange={(v) => setDraft({ ...draft, coast: v as Coast })}>
                <SelectTrigger id="v-coast"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COASTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <TextField
              label="Rating"
              required
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={draft.rating}
              onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
              error={errors.rating}
              helper="1 to 5."
            />

            <div className="flex items-center gap-2.5 sm:pt-7">
              <Switch
                id="v-equipment"
                checked={draft.ownsEquipment}
                onCheckedChange={(v) => setDraft({ ...draft, ownsEquipment: v })}
              />
              <Label htmlFor="v-equipment" className="text-body">Owns equipment</Label>
            </div>

            <TextField
              label="Contact email"
              type="email"
              value={draft.contactEmail}
              onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
              error={errors.contactEmail}
            />
            <TextField
              label="Contact phone"
              value={draft.contactPhone}
              onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
            />
          </div>

          <Field>
            <FieldLabel htmlFor="v-services" required>Services</FieldLabel>
            <div
              id="v-services"
              role="group"
              aria-label="Services this vendor provides"
              className="flex flex-wrap gap-x-5 gap-y-2.5 rounded-md border border-[var(--c-input-border)] p-3"
            >
              {VENDOR_SERVICES.map((s) => (
                <label key={s} className="flex min-h-6 items-center gap-2 text-body">
                  <Checkbox
                    checked={draft.services.includes(s)}
                    onCheckedChange={() => toggleService(s)}
                  />
                  {SERVICE_LABEL[s]}
                </label>
              ))}
            </div>
            {errors.services && <FieldError id="v-services-err">{errors.services}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="v-notes">Notes</FieldLabel>
            <Textarea
              id="v-notes"
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </Field>
        </DetailSection>
      ) : (
        <DetailSection title="Vendor information">
          <DetailGrid>
            <DetailItem label="Tier">
              <StatusBadge tone={TIER_TONE[vendor.tier]} dot={false}>Tier {vendor.tier}</StatusBadge>
            </DetailItem>
            <DetailItem label="Rating"><Rating value={vendor.rating} /></DetailItem>
            <DetailItem label="Based in">{vendor.baseLocation}</DetailItem>
            <DetailItem label="Coast">{vendor.coast}</DetailItem>
            <DetailItem label="Owns equipment">{vendor.ownsEquipment ? "Yes" : "No"}</DetailItem>
            <DetailItem label="Contact email">
              {vendor.contactEmail ? (
                <a href={`mailto:${vendor.contactEmail}`} className="text-primary hover:underline">
                  {vendor.contactEmail}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </DetailItem>
            <DetailItem label="Contact phone">
              {vendor.contactPhone ?? <span className="text-muted-foreground">—</span>}
            </DetailItem>
          </DetailGrid>

          <div>
            <p className="text-caption text-muted-foreground">Services</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {vendor.services.map((s) => (
                <li key={s}><Badge variant="secondary">{SERVICE_LABEL[s] ?? s}</Badge></li>
              ))}
            </ul>
          </div>

          {vendor.notes && (
            <div>
              <p className="text-caption text-muted-foreground">Notes</p>
              <p className="mt-0.5 text-body whitespace-pre-wrap text-foreground">{vendor.notes}</p>
            </div>
          )}
        </DetailSection>
      )}

      <DetailSection
        title="Rate sources"
        description="Where this vendor's rates come into RMS."
      >
        {sources.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
            No rate source is linked to this vendor.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sources.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <span className="text-body font-medium text-foreground">{s.name}</span>
                <StatusBadge tone={SOURCE_TONE[s.status]} dot={false}>
                  {SOURCE_STATUS_LABEL[s.status]}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <AlertDialog open={confirmTier} onOpenChange={setConfirmTier}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Move {vendor.name} to Tier {draft?.tier}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {TIER_GUIDE.find((g) => g.tier === draft?.tier)?.description} Tier decides which lanes
              this vendor is offered for, so quotes built after the change will source differently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Tier {vendor.tier}</AlertDialogCancel>
            <AlertDialogAction onClick={commit}>Move to Tier {draft?.tier}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DetailShell>
  );
}
