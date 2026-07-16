import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = "", variant = "text", width, height, radius, style, ...props }, ref) => {
    const customStyle: React.CSSProperties = {
      ...style,
      width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
      height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
      borderRadius: radius !== undefined ? (typeof radius === "number" ? `${radius}px` : radius) : undefined,
    };

    return (
      <div
        ref={ref}
        style={customStyle}
        className={`glass-skeleton skeleton-${variant} ${className}`}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
