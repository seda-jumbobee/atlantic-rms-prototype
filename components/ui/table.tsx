"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `plain` drops the table's own card chrome. Use it when the table already
 * sits inside a Card, so the two don't stack a border and a radius on top of
 * each other; the scroll container is kept either way.
 *
 * `density="compact"` tightens rows for dense, working tables — charge lines,
 * cost breakdowns, anything read as a block of figures rather than scanned a
 * row at a time. It is set once on the table and every head and cell below
 * follows, so a table is never half-compact.
 */
function Table({
  className,
  containerClassName,
  plain = false,
  density = "default",
  ...props
}: React.ComponentProps<"table"> & {
  containerClassName?: string
  plain?: boolean
  density?: "default" | "compact"
}) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto",
        !plain && "rounded-card border border-[var(--c-card-border)] bg-card shadow-card",
        containerClassName
      )}
    >
      <table
        data-slot="table"
        data-density={density}
        className={cn("group/table w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted [&_tr]:border-b [&_tr]:border-[var(--c-table-border)]", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-[var(--c-table-border)] bg-muted/40 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-13 border-b border-[var(--c-table-border)] transition-colors hover:bg-[var(--c-table-row-hover)] has-aria-expanded:bg-[var(--c-table-row-hover)] data-[state=selected]:bg-[var(--c-table-row-selected)]",
        "group-data-[density=compact]/table:h-9",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, numeric, ...props }: React.ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // The outer edges align with the surrounding card's 20px inset; the
        // gutter between columns stays 12. Set here rather than per page, so
        // every table in the app lines up the same way.
        "h-12 px-3 first:pl-5 last:pr-5 text-left align-middle text-xs font-medium whitespace-nowrap text-[var(--c-table-header-text)] [&:has([role=checkbox])]:pr-0",
        "group-data-[density=compact]/table:h-8 group-data-[density=compact]/table:px-2.5 group-data-[density=compact]/table:first:pl-3 group-data-[density=compact]/table:last:pr-3",
        numeric && "text-right",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, numeric, ...props }: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2 first:pl-5 last:pr-5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        "group-data-[density=compact]/table:px-2.5 group-data-[density=compact]/table:py-1 group-data-[density=compact]/table:first:pl-3 group-data-[density=compact]/table:last:pr-3",
        // Figures line up on their digits and on their right edge, so a column
        // of money can be compared down the page without reading it.
        numeric && "text-right tabular-nums",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
