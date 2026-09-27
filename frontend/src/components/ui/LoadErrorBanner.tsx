import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Shown when a data fetch fails.
 *
 * Why this exists: several screens used to silently fall back to stale
 * `localStorage` data (or just an empty list) when an API call failed. An empty
 * table then looked like "there is no data" rather than "we could not load the
 * data" — which is actively misleading in a system that tracks fees, attendance
 * and student performance. Failures must be visible and retryable.
 */
export function LoadErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        marginBottom: "16px",
        padding: "12px 16px",
        borderRadius: "12px",
        background: "hsla(205, 85%, 50%, 0.08)",
        border: "1px solid hsla(205, 85%, 50%, 0.25)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <AlertCircle size={16} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
      <span style={{ fontSize: "13px", color: "var(--color-danger)", fontWeight: 600, flex: 1, minWidth: "200px" }}>
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#fff",
            border: "1px solid hsla(205, 85%, 50%, 0.35)",
            color: "var(--color-danger)",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}
