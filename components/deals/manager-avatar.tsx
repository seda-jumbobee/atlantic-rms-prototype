import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Small initials avatar chip using the user's brand color. */
export function ManagerAvatar({
  user,
  showName,
  size = "sm",
  className,
}: {
  user?: User;
  showName?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!user) {
    return <span className={cn("text-xs text-muted-foreground", className)}>Unassigned</span>;
  }
  const dim = size === "md" ? "size-7 text-xs" : "size-6 text-[10px]";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-full font-semibold text-white",
          dim,
        )}
        style={{ backgroundColor: user.avatarColor }}
        title={user.name}
      >
        {user.initials}
      </span>
      {showName && <span className="truncate text-sm">{user.name}</span>}
    </span>
  );
}
