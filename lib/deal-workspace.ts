/* ============================================================================
   A deal's working material — driver photos and a manager's notes.

   THERE IS NO SERVER IN THIS PROTOTYPE. Both live in the browser, exactly as
   lib/auth/profile-store.ts does, and both are stand-ins for endpoints that do
   not exist. What that means concretely, and what the UI must say plainly:

     • Nothing is shared. Another manager, another device or another browser
       sees none of it. The page claims photos are "auto-synced to DemSys";
       they are not, and the UI says so rather than implying a sync.

     • Notes are scoped to the signed-in manager because that is all that is
       reachable here — not because notes should be private in a real CRM.
       With a backend these become a shared, attributed thread on the deal.

     • Storage can refuse. Photos are data URLs and an origin has only a few
       megabytes, so a quota failure is a real outcome the caller must handle,
       never something to swallow and report as success.
   ========================================================================= */

const KEY = "rms.deal.workspace.v1";

export interface DealPhoto {
  id: string;
  /** A downscaled JPEG data URL from lib/image.ts — never the raw upload. */
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  addedAt: string;
}

export interface DealNote {
  id: string;
  body: string;
  createdAt: string;
}

export type WorkspaceWrite = { ok: true } | { ok: false; reason: "storage" | "quota" };

/** Keyed by deal, then by the manager the material belongs to. */
type Shape = Record<string, Record<string, { photos?: DealPhoto[]; notes?: DealNote[] }>>;

function read(): Shape {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? ((JSON.parse(raw) as Shape) ?? {}) : {};
  } catch {
    return {};
  }
}

function write(s: Shape): WorkspaceWrite {
  if (typeof window === "undefined") return { ok: false, reason: "storage" };
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return { ok: true };
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, reason: quota ? "quota" : "storage" };
  }
}

function slot(s: Shape, dealId: string, userId: string) {
  s[dealId] ??= {};
  s[dealId][userId] ??= {};
  return s[dealId][userId];
}

/* Ids are generated here rather than passed in, so two photos added in the
   same millisecond cannot collide on a React key. */
let seq = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// ── photos ───────────────────────────────────────────────────────────────────

export function getPhotos(dealId: string, userId: string): DealPhoto[] {
  return read()[dealId]?.[userId]?.photos ?? [];
}

export function addPhoto(
  dealId: string,
  userId: string,
  photo: Omit<DealPhoto, "id" | "addedAt">,
): WorkspaceWrite {
  const s = read();
  const mine = slot(s, dealId, userId);
  mine.photos = [...(mine.photos ?? []), { ...photo, id: newId("ph"), addedAt: new Date().toISOString() }];
  return write(s);
}

export function removePhoto(dealId: string, userId: string, photoId: string): WorkspaceWrite {
  const s = read();
  const mine = slot(s, dealId, userId);
  mine.photos = (mine.photos ?? []).filter((p) => p.id !== photoId);
  return write(s);
}

// ── notes ────────────────────────────────────────────────────────────────────

export const NOTE_MAX_LENGTH = 2000;

/** Newest first — a note is read for what changed most recently. */
export function getNotes(dealId: string, userId: string): DealNote[] {
  return [...(read()[dealId]?.[userId]?.notes ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function noteError(body: string): string | null {
  if (!body.trim()) return "Write something before saving the note.";
  // Counted in code points, so an emoji or a non-Latin script is one
  // character rather than two.
  if ([...body.trim()].length > NOTE_MAX_LENGTH) {
    return `Notes are limited to ${NOTE_MAX_LENGTH.toLocaleString()} characters.`;
  }
  return null;
}

export function addNote(dealId: string, userId: string, body: string): WorkspaceWrite {
  const s = read();
  const mine = slot(s, dealId, userId);
  mine.notes = [
    ...(mine.notes ?? []),
    { id: newId("nt"), body: body.trim(), createdAt: new Date().toISOString() },
  ];
  return write(s);
}

export function removeNote(dealId: string, userId: string, noteId: string): WorkspaceWrite {
  const s = read();
  const mine = slot(s, dealId, userId);
  mine.notes = (mine.notes ?? []).filter((n) => n.id !== noteId);
  return write(s);
}
