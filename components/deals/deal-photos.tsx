"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Camera, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/components/session-provider";
import { addPhoto, getPhotos, removePhoto, type DealPhoto } from "@/lib/deal-workspace";
import { PHOTO_ACCEPT_ATTR, PHOTO_MAX_LABEL, preparePhoto } from "@/lib/image";
import { fmtDate } from "@/lib/format";

/* ============================================================================
   Driver photos.

   Every failure shown here is a real one: a rejected file type, a file over
   the limit, a decode that throws on a truncated image, a browser refusing
   the write because the origin is out of storage. None are simulated, and a
   photo that did not store is never shown as if it had.

   The caption no longer claims the photos are auto-synced to DemSys. They are
   not — nothing leaves the browser — and saying otherwise would be the one
   thing a driver-evidence feature must not do.
   ========================================================================= */

export function DealPhotos({ dealId }: { dealId: string }) {
  const { user } = useSession();
  const [photos, setPhotos] = useState<DealPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Read after mount: localStorage does not exist during the server render.
  useEffect(() => {
    if (user) setPhotos(getPhotos(dealId, user.id));
  }, [dealId, user]);

  if (!user) return null;

  async function onPick(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(ev.target.files ?? []);
    ev.target.value = ""; // so the same file can be picked again
    if (!files.length || !user) return;

    setError(null);
    setBusy(true);
    for (const file of files) {
      const result = await preparePhoto(file);
      if (!result.ok) {
        setError(`${file.name}: ${result.error.message}`);
        continue; // a bad file does not stop the good ones behind it
      }
      const written = addPhoto(dealId, user.id, {
        dataUrl: result.dataUrl,
        name: file.name,
        width: result.width,
        height: result.height,
      });
      if (!written.ok) {
        setError(
          written.reason === "quota"
            ? "There isn’t enough space left in this browser to store the photo. Remove a photo and try again."
            : "We couldn’t save that photo. Please try again.",
        );
        break; // storage is full; the rest would fail the same way
      }
    }
    setPhotos(getPhotos(dealId, user.id));
    setBusy(false);
  }

  function onRemove(photo: DealPhoto) {
    if (!user) return;
    setError(null);
    const res = removePhoto(dealId, user.id, photo.id);
    if (!res.ok) {
      setError("We couldn’t remove that photo. Please try again.");
      return;
    }
    setPhotos(getPhotos(dealId, user.id));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Camera className="size-4 text-muted-foreground" /> Driver photos
          {photos.length > 0 && (
            <span className="text-caption font-normal text-muted-foreground">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          loading={busy}
          loadingText="Adding…"
          aria-describedby="driver-photo-hint"
        >
          <Upload aria-hidden className="size-4" /> Add photos
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={PHOTO_ACCEPT_ATTR}
          onChange={onPick}
          disabled={busy}
          className="sr-only"
          aria-label="Choose driver photos"
        />
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
          No photos yet.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <li key={p.id} className="group relative">
              {/* The stored aspect ratio is kept — a photo of a loaded vehicle
                  is evidence, and squashing it to a square would distort it. */}
              <Image
                src={p.dataUrl}
                alt={p.name}
                width={p.width}
                height={p.height}
                unoptimized
                className="h-20 w-auto max-w-32 rounded-lg border bg-muted object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                onClick={() => onRemove(p)}
                aria-label={`Remove ${p.name}`}
                className="absolute -top-1.5 -right-1.5 opacity-0 shadow-xs transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="size-3" />
              </Button>
              <span className="sr-only">Added {fmtDate(p.addedAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <p id="driver-photo-hint" className="text-caption text-muted-foreground">
        JPG, PNG or WebP, up to {PHOTO_MAX_LABEL} each. Stored in this browser only —
        the DemSys hand-off isn’t wired up in this prototype.
      </p>
    </div>
  );
}
