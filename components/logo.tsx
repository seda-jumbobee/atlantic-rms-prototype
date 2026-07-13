import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {/* anchor / wave mark */}
        <path d="M12 3v15" />
        <circle cx="12" cy="4.2" r="1.6" />
        <path d="M7 9h10" />
        <path d="M5 12a7 7 0 0 0 14 0" />
      </svg>
    </div>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed && (
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-sidebar-foreground">Atlantic RMS</div>
          <div className="text-[11px] text-sidebar-foreground/60">Rate Management</div>
        </div>
      )}
    </div>
  );
}
