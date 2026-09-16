import type { ReactNode } from "react";

/** Consistent page header: title + subtitle on the left, actions on the right. */
export function PageHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#343a40", margin: "0 0 3px", display: "flex", alignItems: "center", gap: "10px" }}>
          {icon && <span style={{ color: "#007bff", display: "flex" }}>{icon}</span>}
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: "13px", color: "#6c757d", margin: 0 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
