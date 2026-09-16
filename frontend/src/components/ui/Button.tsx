import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #007bff, #0069d9)",
    color: "#fff",
    border: "none",
    boxShadow: "0 4px 14px rgba(0,123,255,0.25)",
  },
  secondary: {
    background: "hsl(320,20%,94%)",
    color: "#343a40",
    border: "1px solid hsla(285,30%,20%,0.1)",
  },
  ghost: {
    background: "transparent",
    color: "#343a40",
    border: "1px solid hsla(285,30%,20%,0.1)",
  },
  danger: {
    background: "linear-gradient(135deg, hsl(205, 85%, 50%), hsl(350,90%,42%))",
    color: "#fff",
    border: "none",
  },
  success: {
    background: "linear-gradient(135deg, hsl(142,70%,40%), hsl(160,70%,35%))",
    color: "#fff",
    border: "none",
  },
  outline: {
    background: "#fff",
    color: "#343a40",
    border: "1.5px solid hsla(285,30%,20%,0.15)",
  },
  default: {
    background: "#0069d9",
    color: "#fff",
    border: "none",
  },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  default: { height: "38px", padding: "0 18px", fontSize: "13px", borderRadius: "10px" },
  sm: { height: "32px", padding: "0 12px", fontSize: "12px", borderRadius: "8px" },
  lg: { height: "44px", padding: "0 24px", fontSize: "14px", borderRadius: "12px" },
  icon: { width: "38px", height: "38px", padding: "0", borderRadius: "10px" },
};

function Button({
  variant = "default",
  size = "default",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.default;

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    opacity: disabled || isLoading ? 0.6 : 1,
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
    outline: "none",
    boxSizing: "border-box",
    ...sizeStyle,
    ...variantStyle,
    ...style,
  };

  return (
    <button
      data-slot="button"
      disabled={disabled || isLoading}
      style={baseStyle}
      {...props}
    >
      {isLoading ? (
        <>
          <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span style={{ display: "inline-flex", alignItems: "center" }}>{leftIcon}</span>}
          {children}
          {rightIcon && <span style={{ display: "inline-flex", alignItems: "center" }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

export { Button };
