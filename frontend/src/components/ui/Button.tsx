import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97]",
        primary:
          "bg-gradient-to-r from-[hsl(328,100%,54%)] to-[hsl(271,91%,60%)] text-white shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.97] focus-visible:ring-[hsl(328,100%,54%)]",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 active:scale-[0.97]",
        danger:
          "bg-gradient-to-r from-[hsl(342,90%,48%)] to-[hsl(350,90%,42%)] text-white shadow-sm hover:opacity-90 active:scale-[0.97]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent/10 hover:text-accent-foreground active:scale-[0.97]",
        secondary:
          "bg-[hsl(320,20%,94%)] text-[hsl(285,50%,12%)] shadow-sm hover:bg-[hsl(320,20%,90%)] active:scale-[0.97]",
        success:
          "bg-gradient-to-r from-[hsl(142,70%,40%)] to-[hsl(160,70%,35%)] text-white shadow-sm hover:opacity-90 active:scale-[0.97]",
        warning:
          "bg-gradient-to-r from-[hsl(271,91%,60%)] to-[hsl(260,91%,55%)] text-white shadow-sm hover:opacity-90 active:scale-[0.97]",
        ghost:
          "hover:bg-accent/10 hover:text-accent-foreground active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5 text-[13px]",
        sm: "h-8 rounded-lg px-3.5 py-1.5 text-xs",
        lg: "h-12 rounded-xl px-7 py-3 text-base",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex items-center">{rightIcon}</span>}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
