import React from "react";

/** Shared form input style — subtle inset, no heavy border */
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(29,10,39,0.06)",
  background: "var(--surface-glass)",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-primary)",
  outline: "none",
};

/** Shared form label style */
export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  marginBottom: "6px",
  letterSpacing: "0.5px",
};

/** Borderless card — elevation only */
export const clayCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: "20px",
  border: "none",
  boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)",
};

/** Small borderless card */
export const clayCardSm: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  border: "none",
  boxShadow: "0 1px 6px rgba(29,10,39,0.04), 0 4px 16px -6px rgba(29,10,39,0.06)",
};

/** Section container — borderless */
export const claySection: React.CSSProperties = {
  background: "#fff",
  borderRadius: "20px",
  border: "none",
  boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)",
  overflow: "hidden",
};
