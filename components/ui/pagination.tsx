import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

const paginationLinkVariants = cva(
  "inline-flex h-8 items-center justify-center gap-1 rounded-lg border text-sm leading-5 font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      isActive: {
        true: "border-transparent bg-primary text-primary-foreground",
        false: "border-border text-foreground",
      },
      size: {
        default: "px-2.5",
        icon: "w-8 px-0",
      },
    },
    defaultVariants: {
      isActive: false,
      size: "default",
    },
  }
)

function PaginationLink({
  className,
  isActive,
  size,
  ...props
}: React.ComponentProps<"a"> & VariantProps<typeof paginationLinkVariants>) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(paginationLinkVariants({ isActive, size }), className)}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span>Prev</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex h-8 items-center justify-center px-2.5 text-muted-foreground [&>svg]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  paginationLinkVariants,
}
