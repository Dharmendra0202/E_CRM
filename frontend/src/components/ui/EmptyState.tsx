import type { ReactNode } from "react";

/** Consistent empty-state block for lists/tables. */
export function EmptyState({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ padding: "50px 24px", textAlign: "center", color: "#a0a6ad" }}>
      {icon && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", opacity: 0.5 }}>{icon}</div>
      )}
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#6c757d" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "12px", marginTop: "4px" }}>{subtitle}</div>}
    </div>
  );
}
