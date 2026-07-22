"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      icons={{
        success: (
          <CircleCheckIcon className="size-[18px]" />
        ),
        info: (
          <InfoIcon className="size-[18px]" />
        ),
        warning: (
          <TriangleAlertIcon className="size-[18px]" />
        ),
        error: (
          <OctagonXIcon className="size-[18px]" />
        ),
        loading: (
          <Loader2Icon className="size-[18px] animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--width": "320px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "bg-popover! border-border! text-popover-foreground! py-3! pl-3.5! pr-3! gap-2.5! shadow-[0px_4px_4px_rgba(0,0,0,0.1)]! text-sm! font-medium! leading-5! tracking-[-0.005em]!",
          content: "flex-1",
          title: "leading-5!",
          description: "text-muted-foreground!",
          icon: "size-[18px]! m-0! [&_svg]:m-0!",
          closeButton:
            "static! order-last! shrink-0 transform-none! bg-transparent! border-0! text-popover-foreground! [&>svg]:size-3.5!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
