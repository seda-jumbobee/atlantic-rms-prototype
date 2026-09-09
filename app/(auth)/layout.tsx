/**
 * The authentication route group renders its own full-page shell
 * (components/auth/auth-shell.tsx → AuthLayout), which owns the purple banner,
 * the responsive two-column grid and the page background. This layout stays a
 * passthrough so there is exactly one place that defines auth page structure.
 */
export default function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
