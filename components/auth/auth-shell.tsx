import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
   Authentication layout — mirrors Figma "04 - Screens / welcome" (25:276).

   Desktop (>= xl / 1280): two columns.
     • Purple banner on the left with 40px margins on the left, top and bottom.
     • ~160px between the banner and the form at 1920px wide.
       Both the banner width and that gap are fluid so the layout scales instead
       of snapping: at 1920 they resolve to exactly 768px and 160px, matching
       the Figma frame, and shrink smoothly below that.

   Tablet and mobile (< xl): the banner is REMOVED from the DOM entirely (not
   shrunk) and the page becomes a single centred column. The welcome heading is
   still shown, so the branding message is not lost.
   ========================================================================= */

/** The Figma calculator mark. This is the exported Figma asset, not a stand-in. */
export function CalculatorMark({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static SVG; no optimisation needed
    <img
      src="/brand/calculator-64.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0", className)}
    />
  );
}

export const WELCOME_TITLE = "Welcome to Rate Management System";
const BANNER_SUBTITLE = "Log in by using your credentials or request access.";

function Banner() {
  return (
    <aside
      aria-hidden
      className={cn(
        "relative hidden overflow-hidden rounded-[48px] bg-primary xl:block",
        "min-h-[calc(100dvh-80px)]",
      )}
    >
      {/* Decorative shapes, positioned proportionally to the Figma 768x1000 frame */}
      {/* eslint-disable @next/next/no-img-element -- local static SVGs, absolutely positioned; next/image adds no value here */}
      <img
        src="/brand/auth-banner-swoosh.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -top-[16.45%] -left-[4.8%] h-[78.6%] w-[128.7%] max-w-none"
      />
      <img
        src="/brand/auth-banner-ellipse.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -top-[41.6%] left-[37.5%] h-[83.2%] w-[90.9%] max-w-none"
      />
      {/* eslint-enable @next/next/no-img-element */}

      {/* Bottom-anchored content block, 80px inset as in Figma */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-7 p-20">
        <div className="grid size-20 place-items-center rounded-[20px] bg-white/60">
          <CalculatorMark size={64} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-h1 text-primary-subtle">{WELCOME_TITLE}</p>
          <p className="text-body text-primary-border">{BANNER_SUBTITLE}</p>
        </div>
      </div>
    </aside>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "min-h-dvh bg-background",
        // Fluid so 1920px lands exactly on Figma's 768px banner / 160px gap.
        "xl:grid xl:grid-cols-[clamp(360px,40vw,768px)_minmax(0,1fr)]",
        "xl:gap-x-[clamp(48px,8.33vw,160px)] xl:p-10",
      )}
    >
      <Banner />
      <main className="flex min-h-dvh w-full items-center justify-center px-5 py-10 sm:px-8 xl:min-h-0 xl:justify-start xl:p-0">
        <div className="flex w-full max-w-[547px] flex-col gap-10 xl:gap-20">{children}</div>
      </main>
    </div>
  );
}

/** Icon + title + description. `AuthHeader` is used by every auth screen. */
export function AuthHeader({
  title,
  description,
  showWelcome,
}: {
  title: string;
  description?: ReactNode;
  /** On small screens the banner is gone, so screens can restate the welcome. */
  showWelcome?: boolean;
}) {
  return (
    <header className="flex flex-col gap-5">
      <CalculatorMark size={48} />
      {showWelcome && (
        <p className="text-label text-muted-foreground xl:hidden">{WELCOME_TITLE}</p>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-balance text-foreground">{title}</h1>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
    </header>
  );
}

/** The bordered card at the bottom of the login / request-access screens. */
export function AuthSupportCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-border-divider bg-card p-5 text-center shadow-card">
      {children}
    </div>
  );
}

/** Groups a form's fields with the Figma 20px rhythm. */
export function AuthFields({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-5", className)}>{children}</div>;
}
