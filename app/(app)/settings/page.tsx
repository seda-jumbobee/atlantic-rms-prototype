"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReadOnlyField, TextField } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/components/session-provider";
import {
  clearAvatar, displayNameError, setAvatar, setDisplayName,
} from "@/lib/auth/profile-store";
import { AVATAR_ACCEPT_ATTR, AVATAR_MAX_LABEL, prepareAvatar } from "@/lib/image";

/* ============================================================================
   Settings — the account's own profile and security.

   Everything here writes to the browser-local profile store, which stands in
   for a `PATCH /me` endpoint this prototype does not have. Failures are the
   real ones the code can hit (a rejected file type, a file over the limit, a
   decode that throws, a storage quota refusal) — none are simulated, and none
   report success for a write that did not happen.
   ========================================================================= */

type SaveState = "idle" | "saving" | "saved";
type UploadState = "idle" | "working";

function SectionCard({
  title, description, children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <Card asChild className="gap-6 p-6">
      <section aria-labelledby={id}>
        <div className="flex flex-col gap-1">
          <h2 id={id} className="text-h4 text-foreground">{title}</h2>
          {description && <p className="text-body text-muted-foreground">{description}</p>}
        </div>
        {children}
      </section>
    </Card>
  );
}

export default function SettingsPage() {
  const { user, refreshProfile } = useSession();

  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [upload, setUpload] = useState<UploadState>("idle");
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Seed the name once per account rather than on every session change, so a
  // photo upload (which refreshes the session) cannot discard an in-progress
  // edit to the name field.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user || seededFor.current === user.email) return;
    seededFor.current = user.email;
    setName(user.name);
  }, [user]);

  if (!user) return null;

  // Derived, not state: the session is the single source of truth for the
  // photo, so an upload or a removal is reflected without a second copy to
  // keep in sync.
  const photo = user.avatarUrl;

  const trimmed = name.trim();
  const dirty = trimmed !== user.name.trim();
  const canSave = dirty && !displayNameError(name) && saveState !== "saving";

  async function onSaveName(ev: React.FormEvent) {
    ev.preventDefault();
    if (!user || saveState === "saving") return;

    const err = displayNameError(name);
    setNameErr(err);
    setSaveErr(null);
    if (err) return;

    setSaveState("saving");
    const res = setDisplayName(user.email, name);
    if (!res.ok) {
      // The entered value is kept — nothing is silently reverted.
      setSaveState("idle");
      setSaveErr("Couldn’t save your changes. Please try again.");
      return;
    }
    refreshProfile();
    setSaveState("saved");
    toast.success("Your profile has been updated.");
  }

  async function onPickPhoto(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    // Reset the input so picking the same file twice still fires a change.
    ev.target.value = "";
    if (!file || !user) return;

    setPhotoErr(null);
    setUpload("working");

    const result = await prepareAvatar(file);
    if (!result.ok) {
      setUpload("idle");
      setPhotoErr(result.error.message);
      return; // the existing photo is untouched
    }

    const written = setAvatar(user.email, result.dataUrl);
    if (!written.ok) {
      setUpload("idle");
      setPhotoErr(
        written.reason === "quota"
          ? "There isn’t enough space left in this browser to store the photo. Remove your current photo and try again."
          : "We couldn’t upload your photo. Please try again."
      );
      return;
    }

    setUpload("idle");
    refreshProfile();
    toast.success("Profile photo updated.");
  }

  function onRemovePhoto() {
    if (!user) return;
    setPhotoErr(null);
    const res = clearAvatar(user.email);
    if (!res.ok) {
      setPhotoErr("We couldn’t remove your photo. Please try again.");
      return;
    }
    refreshProfile();
    toast.success("Profile photo removed.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your Atlantic RMS account." />

      <SectionCard title="Profile" description="How you appear across Atlantic RMS.">
        {/* ── photo ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar src={photo} name={user.name} size={96} />
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                loading={upload === "working"}
                loadingText="Uploading…"
                aria-describedby="photo-hint"
              >
                <Upload aria-hidden className="size-4" />
                {photo ? "Change photo" : "Upload photo"}
              </Button>
              {photo && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onRemovePhoto}
                  disabled={upload === "working"}
                >
                  Remove photo
                </Button>
              )}
            </div>
            <p id="photo-hint" className="text-caption text-muted-foreground">
              JPG, PNG or WebP, up to {AVATAR_MAX_LABEL}. Cropped to a square.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT_ATTR}
              onChange={onPickPhoto}
              disabled={upload === "working"}
              className="sr-only"
              aria-label="Choose a profile photo"
            />
          </div>
        </div>

        {photoErr && (
          <Alert variant="destructive" role="alert">
            <AlertCircle aria-hidden />
            <AlertDescription>{photoErr}</AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* ── name + email ──────────────────────────────────────────────── */}
        <form onSubmit={onSaveName} noValidate className="flex flex-col gap-5">
          {/* Two columns from sm up: the container now fills the content area,
              and a lone full-width name field would stretch past any sensible
              measure on a wide screen. */}
          <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Full name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaveState("idle");
              if (nameErr) setNameErr(displayNameError(e.target.value));
            }}
            onBlur={() => setNameErr(displayNameError(name))}
            error={nameErr ?? undefined}
          />

          {/* Read-only: the corporate address is the account identifier, and
              nothing in this architecture can change it. */}
          <div className="flex flex-col gap-1.5">
            <ReadOnlyField
              label="Corporate email"
              value={<span className="truncate">{user.email}</span>}
            />
            <p className="text-caption text-muted-foreground">
              Your corporate account identifier. Contact your administrator to change it.
            </p>
          </div>
          </div>

          {saveErr && (
            <Alert variant="destructive" role="alert">
              <AlertCircle aria-hidden />
              <AlertDescription>{saveErr}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={!canSave}
              loading={saveState === "saving"}
              loadingText="Saving…"
            >
              Save changes
            </Button>
            {/* Also announced via the toast; this keeps the confirmation
                anchored to the form for anyone not watching the corner. */}
            <p aria-live="polite" className="text-body text-status-positive-fg">
              {saveState === "saved" && !dirty ? "Your profile has been updated." : ""}
            </p>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Change password"
        description="Create a new password for your Atlantic RMS account."
      >
        <ChangePasswordForm />
      </SectionCard>
    </div>
  );
}
