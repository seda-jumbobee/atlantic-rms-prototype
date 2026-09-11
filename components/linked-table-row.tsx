"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ============================================================================
   A table row that opens a record.

   The row is NOT turned into a button. It keeps a real link inside it — the
   record's own id cell — and that link stays the thing keyboards and screen
   readers use: one tab stop, a real href, a status-bar preview on hover. The
   row click is a convenience laid over the top for pointers.

   Making the <tr> itself focusable would add a second tab stop that goes to
   the same place and announces as a row you can press, which is worse than
   what it replaces. Instead `focus-within` lights the whole row when the link
   inside it is focused, so keyboard users see the same highlight.

   Clicks that start inside anything interactive are left alone, so an action
   button, a nested link or a checkbox performs its own job rather than
   navigating. Text selection is honoured too: dragging to select inside a row
   should not navigate when the pointer is released.
   ========================================================================= */

const INTERACTIVE = "a, button, input, select, textarea, label, [role='button'], [role='link'], [role='menuitem'], [data-no-row-nav]";

export function LinkedTableRow({
  href,
  children,
  className,
  ...props
}: React.ComponentProps<typeof TableRow> & { href: string }) {
  const router = useRouter();

  return (
    <TableRow
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (e.defaultPrevented) return;
        if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
        // A drag that selected text is not a click on the row.
        if (window.getSelection()?.toString()) return;
        router.push(href);
      }}
      className={cn(
        "cursor-pointer transition-colors",
        "focus-within:bg-[var(--c-table-row-hover)]",
        className,
      )}
    >
      {children}
    </TableRow>
  );
}
