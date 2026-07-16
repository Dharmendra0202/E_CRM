import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Determine if we should apply the React Bits animated style
    const isAnimated = variant === "primary" && !disabled && !isLoading;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`glass-btn btn-${variant} btn-${size} ${isAnimated ? "react-bits-animated-btn" : ""} ${isLoading ? "btn-loading" : ""} ${className}`}
        {...props}
      >
        {isAnimated && <span className="react-bits-shimmer"></span>}
        <span className="btn-inner-content">
          {isLoading && <span className="btn-spinner" />}
          {!isLoading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
          <span className="btn-content">{children}</span>
          {!isLoading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

