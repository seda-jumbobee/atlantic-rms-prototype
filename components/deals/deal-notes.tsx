"use client";

import { useEffect, useState } from "react";
import { AlertCircle, NotebookPen, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/components/session-provider";
import {
  addNote, getNotes, noteError, NOTE_MAX_LENGTH, removeNote, type DealNote,
} from "@/lib/deal-workspace";
import { fmtDate, relativeAge } from "@/lib/format";

/* ============================================================================
   Notes on a deal, belonging to the manager who wrote them.

   Scoped to the signed-in manager because that is all this prototype can
   reach, NOT because notes should be private in a CRM. There is no server, so
   there is nowhere to put a note another manager could read; with a backend
   these become a shared, attributed thread on the deal and this component's
   shape does not have to change — only where it reads from.

   The UI says where the notes live, so nobody files something important here
   expecting a colleague to find it.
   ========================================================================= */

export function DealNotes({ dealId }: { dealId: string }) {
  const { user } = useSession();
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // localStorage is not available during the server render.
  useEffect(() => {
    if (user) setNotes(getNotes(dealId, user.id));
  }, [dealId, user]);

  if (!user) return null;

  const remaining = NOTE_MAX_LENGTH - [...body].length;

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!user || saving) return;

    const err = noteError(body);
    setError(err);
    if (err) return;

    setSaving(true);
    const res = addNote(dealId, user.id, body);
    setSaving(false);
    if (!res.ok) {
      // The note is NOT cleared — a failed save must not eat what was typed.
      setError(
        res.reason === "quota"
          ? "There isn’t enough space left in this browser to store the note. Remove an older note and try again."
          : "We couldn’t save that note. Please try again.",
      );
      return;
    }
    setBody("");
    setNotes(getNotes(dealId, user.id));
  }

  function onRemove(note: DealNote) {
    if (!user) return;
    setError(null);
    const res = removeNote(dealId, user.id, note.id);
    if (!res.ok) {
      setError("We couldn’t remove that note. Please try again.");
      return;
    }
    setNotes(getNotes(dealId, user.id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="size-4 text-primary" /> My notes
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} noValidate className="space-y-2">
          <Label htmlFor="deal-note" className="sr-only">Add a note about this deal</Label>
          <Textarea
            id="deal-note"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError(noteError(e.target.value));
            }}
            rows={3}
            placeholder="What happened, what to chase, what the customer asked for…"
            aria-invalid={!!error || undefined}
            aria-describedby="deal-note-hint"
          />
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id="deal-note-hint" className="text-caption text-muted-foreground">
              Visible to you, in this browser — a shared deal thread needs a backend.
              {remaining < 200 && ` ${remaining.toLocaleString()} characters left.`}
            </p>
            <Button type="submit" size="sm" disabled={!body.trim() || saving}>
              Add note
            </Button>
          </div>
        </form>

        {notes.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-caption text-muted-foreground">
            No notes on this deal yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* whitespace-pre-wrap so line breaks the manager typed survive */}
                  <p className="min-w-0 flex-1 text-sm break-words whitespace-pre-wrap">{n.body}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(n)}
                    aria-label="Delete this note"
                    className="-mt-1 -mr-1 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <p className="mt-1.5 text-caption text-muted-foreground">
                  <time dateTime={n.createdAt} title={fmtDate(n.createdAt)}>
                    {relativeAge(n.createdAt)}
                  </time>
                  {" · "}{user.name}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
