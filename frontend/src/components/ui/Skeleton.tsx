import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect"
  width?: number | string
  height?: number | string
}

function Skeleton({ className, variant = "rect", width, height, style, ...props }: SkeletonProps) {
  const computedStyle: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent/20 animate-pulse",
        variant === "circle" ? "rounded-full" : variant === "text" ? "rounded h-4" : "rounded-md",
        className
      )}
      style={computedStyle}
      {...props}
    />
  )
}

export { Skeleton }
