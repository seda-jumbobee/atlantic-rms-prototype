"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Sparkles, Route, Calculator, Briefcase, History,
  Building2, Database, Inbox, Plug, ChevronRight, ChevronLeft, Ship, Truck, Forklift,
  CarFront, Container, Maximize, Box, TruckElectric, Library, Users, Activity,
  LayoutTemplate, Receipt, BarChart3,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Logo } from "@/components/logo";
import { useSession } from "@/components/session-provider";
import { CALCULATORS } from "@/lib/data/calculators";
import { FRONT_RATE_REQUESTS } from "@/lib/data/front";

const CALC_ICON: Record<string, typeof Ship> = {
  Ship, Truck, Forklift, CarFront, Container, Maximize, Box, TruckElectric, Calculator,
};

const MAIN = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quote-master", label: "Quote Master", icon: Sparkles },
  { href: "/route-builder", label: "Route Builder", icon: Route },
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

// Active/selected = Brand/Primary/Active; hover keeps sidebar-accent (Brand/Primary/Hover)
const NAV_ITEM =
  "h-auto px-4 py-3 data-[active=true]:bg-sidebar-active data-[active=true]:text-sidebar-foreground data-[active=true]:hover:bg-sidebar-active";

/** Jira-style expand/collapse control on the sidebar/content boundary (desktop only;
    mobile keeps the topbar trigger + sheet). The SidebarRail below it keeps the whole
    border clickable as a large hit area. */
function BoundaryToggle() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-16 -right-3 z-30 hidden size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm outline-none transition hover:text-foreground hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 md:flex"
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const newFront = FRONT_RATE_REQUESTS.filter((f) => f.status === "new").length;
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const calcOpen = pathname.startsWith("/calculators");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3.5">
        <Logo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {MAIN.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active(item.href)} tooltip={item.label} className={NAV_ITEM}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Calculators (collapsible group) */}
            <Collapsible defaultOpen={calcOpen} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={calcOpen} tooltip="Calculators" className={NAV_ITEM}>
                    <Calculator />
                    <span>Calculators</span>
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {CALCULATORS.map((c) => {
                      const Icon = CALC_ICON[c.icon] ?? Calculator;
                      return (
                        <SidebarMenuSubItem key={c.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/calculators/${c.id}`}
                            className="data-[active=true]:bg-sidebar-active data-[active=true]:text-sidebar-foreground data-[active=true]:hover:bg-sidebar-active"
                          >
                            <Link href={`/calculators/${c.id}`}>
                              <Icon className="size-3.5" />
                              <span>{c.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {SECONDARY.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active(item.href)} tooltip={item.label} className={NAV_ITEM}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarMenu>
              {ADMIN.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={active(item.href)} tooltip={item.label} className={NAV_ITEM}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.href === "/admin/front-review" && newFront > 0 && (
                    <SidebarMenuBadge className="peer-data-[size=default]/menu-button:top-1/2 right-4 h-auto min-w-0 -translate-y-1/2 rounded-full bg-sidebar-primary px-1.5 py-px text-caption font-normal whitespace-nowrap text-sidebar-primary-foreground">
                      {newFront}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="text-caption text-sidebar-foreground/50 px-3 pb-3">
        <span className="group-data-[collapsible=icon]:hidden">v0.1 · prototype · API · CLI · MCP</span>
      </SidebarFooter>
      <BoundaryToggle />
      <SidebarRail />
    </Sidebar>
  );
}
