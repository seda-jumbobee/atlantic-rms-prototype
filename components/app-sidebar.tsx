"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Sparkles, Route, Calculator, Briefcase, History,
  Building2, Database, Inbox, Plug, ChevronRight, ChevronLeft, Library, Users, Activity,
  LayoutTemplate, Receipt, BarChart3, LogOut, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import { useSession } from "@/components/session-provider";
import { FRONT_RATE_REQUESTS } from "@/lib/data/front";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quote-master", label: "Rate Quote", icon: Sparkles },
  { href: "/route-builder", label: "Custom Route", icon: Route },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
];
const SECONDARY = [
  { href: "/deals", label: "Deals & CRM", icon: Briefcase },
  { href: "/history", label: "History", icon: History },
];
const ADMIN = [
  { href: "/admin/vendors", label: "Vendors", icon: Building2 },
  { href: "/admin/rate-library", label: "Rate Library", icon: Library },
  { href: "/admin/data-sources", label: "Data Sources", icon: Database },
  { href: "/admin/front-review", label: "Front Rate Review", icon: Inbox },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/request-log", label: "Request Log", icon: Activity },
  { href: "/admin/users", label: "Users & Permissions", icon: Users },
  { href: "/admin/integrations", label: "Integrations & API", icon: Plug },
];

/* Nav item — Figma "04 - Screens / Dashboard".
   48px tall, 16px radius. Selected is a translucent white pill with the
   brand label colour; hover is the same pill at lower opacity. The colour is
   never the only cue: the selected item is also bold and carries
   aria-current from SidebarMenuButton's data-active.
   Collapsed, the item becomes a 48px square so the icon target does not
   shrink — overriding the shared component's 32px icon-mode default. */
const NAV_ITEM = cn(
  "h-12 gap-2 rounded-md px-3 text-body",
  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  "data-active:rounded-card data-active:bg-sidebar-active data-active:font-semibold data-active:text-sidebar-active-foreground",
  "data-active:hover:bg-sidebar-active data-active:hover:text-sidebar-active-foreground",
  // The rail is 112px, wide enough that a clipped label would still peek out,
  // so the label is removed rather than hidden by overflow. The tooltip on
  // SidebarMenuButton carries the name in its place.
  "group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
  "group-data-[collapsible=icon]:[&>span:last-child]:hidden",
);

/** The single expand/collapse control, centred on the sidebar/content seam.
    One button for both directions: the chevron flips and the label changes,
    so there is no second control to find once the rail is collapsed.
    It can sit on the seam without drawing a line down it — the sidebar's
    right border and SidebarRail (whose ::after painted that line on hover)
    are both gone.
    Desktop only — below md the sidebar is an off-canvas sheet driven by the
    topbar trigger. */
function BoundaryToggle() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={label}
          aria-expanded={!collapsed}
          className={cn(
            "absolute top-[3.625rem] -right-4 z-30 hidden size-8 items-center justify-center rounded-full md:flex",
            "border border-border-divider bg-card text-muted-foreground shadow-card",
            "transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground",
          )}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Account block, bottom-left. This is the only account surface in the app —
    the top bar no longer carries one. */
function AccountMenu() {
  const { user, logout } = useSession();
  const { state, isMobile } = useSidebar();
  const router = useRouter();
  const collapsed = state === "collapsed" && !isMobile;

  if (!user) return null;

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-card p-3 text-left transition-colors",
        "bg-sidebar-active hover:bg-card",
        // Not centred when collapsed: the avatar keeps the same 12px inset it
        // has expanded, so it does not shift sideways as the rail animates.
        collapsed && "gap-0",
      )}
    >
      <UserAvatar src={user.avatarUrl} name={user.name} size={48} />
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-sidebar-foreground">
            {user.name}
          </span>
          <span className="block truncate text-caption text-fg-tertiary">{user.title}</span>
        </span>
      )}
      <span className="sr-only">Account menu for {user.name}</span>
    </button>
  );

  return (
    <DropdownMenu>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            {user.name} · {user.title}
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent side="top" align="start" className="w-64">
        {/* The signed-in address, read-only. Long addresses truncate and the
            full value is available on hover and focus rather than wrapping
            the menu. */}
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="block max-w-full truncate rounded-sm">
                {user.email}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-72 break-all">
              {user.email}
            </TooltipContent>
          </Tooltip>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { logout(); router.replace("/login"); }}>
          <LogOut className="size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const isAdmin = user?.role === "admin";
  const newFront = FRONT_RATE_REQUESTS.filter((f) => f.status === "new").length;
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = (entry: { href: string; label: string; icon: typeof LayoutDashboard }) => (
    <SidebarMenuItem key={entry.href}>
      <SidebarMenuButton asChild isActive={active(entry.href)} tooltip={entry.label} className={NAV_ITEM}>
        <Link href={entry.href}>
          <entry.icon />
          <span>{entry.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    // The rail sits directly on --shell with no panel fill and no divider:
    // sidebar and page background are one surface, the content card floats on it.
    <Sidebar collapsible="icon">
      {/* The logo sits on the search field's centre line, as in Figma
          "04 - Screens / Dashboard". The sidebar starts at the viewport top
          while the search sits inside the content card, so the header's top
          padding carries the card's own inset (24) plus its top padding (32);
          an h-9 row then matches the field's height, putting both centres on
          y=74. Below md the sidebar is an off-canvas sheet with no card to
          line up against. */}
      <SidebarHeader className="px-6 pt-6 pb-4 md:pt-14 md:pb-10">
        <span className="flex h-9 items-center">
          <Link
            href="/"
            aria-label="Atlantic Rate Management System — dashboard"
            className="rounded-md"
          >
            <Logo collapsed={collapsed} />
          </Link>
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-6 py-0">
          <SidebarMenu>
            {MAIN.map(item)}
            {SECONDARY.map(item)}
          </SidebarMenu>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="px-6 pt-4 pb-0">
            <SidebarGroupLabel className="px-3 text-fg-tertiary group-data-[collapsible=icon]:sr-only">
              Administration
            </SidebarGroupLabel>
            <SidebarMenu>
              {ADMIN.map((entry) => (
                <SidebarMenuItem key={entry.href}>
                  <SidebarMenuButton asChild isActive={active(entry.href)} tooltip={entry.label} className={NAV_ITEM}>
                    <Link href={entry.href}>
                      <entry.icon />
                      <span>{entry.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {entry.href === "/admin/front-review" && newFront > 0 && (
                    <SidebarMenuBadge className="peer-data-[size=default]/menu-button:top-1/2 right-4 h-auto min-w-0 -translate-y-1/2 rounded-full bg-primary px-1.5 py-px text-caption font-normal whitespace-nowrap text-primary-foreground group-data-[collapsible=icon]:hidden">
                      {newFront}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-2 px-6 pt-4 pb-6">
        <AccountMenu />
      </SidebarFooter>
      <BoundaryToggle />
    </Sidebar>
  );
}
