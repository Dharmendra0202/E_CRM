import type { ReactNode } from "react";
import { X } from "lucide-react";
import { FONT } from "../../utils/theme";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
  /** Set false to render your own header inside children (e.g. gradient header). */
  showHeader?: boolean;
  footer?: ReactNode;
}

/**
 * Shared modal shell — standard overlay, centered card, scrollable body.
 * Replaces the hand-rolled fixed/inset overlays scattered across components.
 */
export function Modal({ open, onClose, title, children, maxWidth = 520, showHeader = true, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: "20px", fontFamily: FONT,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "12px", width: "100%", maxWidth: `${maxWidth}px`,
          maxHeight: "90vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)", overflow: "hidden",
        }}
      >
        {showHeader && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #f0f1f4", flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#343a40" }}>{title}</h3>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6c757d", display: "flex" }}>
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ padding: showHeader ? "20px 22px" : 0, overflowY: "auto", flex: 1 }}>
          {children}
        </div>
        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 22px", borderTop: "1px solid #f0f1f4", flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
