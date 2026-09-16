import { Loader2 } from "lucide-react";
import { VALUE } from "../../utils/theme";

/** Centered loading spinner with optional label. */
export function Spinner({ label, size = 26 }: { label?: string; size?: number }) {
  return (
    <div style={{ padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: VALUE }}>
      <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />
      {label && <span style={{ fontSize: "14px" }}>{label}</span>}
    </div>
  );
}
