import type { ReactNode } from "react";
import { CARD_SHADOW } from "../../utils/theme";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: string;   // accent color for icon tile + value
  sub?: string;
  onClick?: () => void;
}

/** Consistent KPI / stat card: icon tile + label + value. */
export function StatCard({ label, value, icon, color = "#007bff", sub, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, padding: "18px 20px",
        cursor: onClick ? "pointer" : "default", transition: "transform 0.15s ease",
        display: "flex", alignItems: "center", gap: "14px",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.transform = "none"; }}
    >
      {icon && (
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: "#343a40", lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: "11px", color: "#a0a6ad", marginTop: "2px" }}>{sub}</div>}
      </div>
    </div>
  );
}
