import React from "react";
import { openWhatsApp, normalizePhone } from "../../utils/whatsapp";
import { WhatsAppLogo } from "./WhatsAppLogo";

interface WhatsAppButtonProps {
  phone?: string | null;
  message?: string;
  label?: string;
  size?: "sm" | "md";
  /** If true, renders just the green circular icon (for tables/cards). */
  iconOnly?: boolean;
  title?: string;
}

/**
 * A reliable "Send WhatsApp" button. Opens WhatsApp (app/web) with the number
 * and pre-filled message via wa.me. Disabled if the phone number is invalid.
 */
export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone, message, label = "WhatsApp", size = "md", iconOnly = false, title,
}) => {
  const valid = !!normalizePhone(phone);
  const iconSize = size === "sm" ? 15 : 17;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!valid) return;
    openWhatsApp(phone, message);
  };

  if (iconOnly) {
    return (
      <button
        onClick={handleClick}
        disabled={!valid}
        title={title || (valid ? "Send WhatsApp message" : "No valid phone number")}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: size === "sm" ? 28 : 34, height: size === "sm" ? 28 : 34,
          borderRadius: "50%", border: "none",
          background: valid ? "linear-gradient(135deg,#25d366,#128c7e)" : "#e5e7eb",
          color: valid ? "#fff" : "#9ca3af", cursor: valid ? "pointer" : "not-allowed",
          flexShrink: 0,
        }}
      >
        <WhatsAppLogo size={iconSize} color="#fff" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!valid}
      title={title || (valid ? "Send WhatsApp message" : "No valid phone number")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: size === "sm" ? "6px 12px" : "9px 16px",
        borderRadius: 8, border: "none",
        background: valid ? "linear-gradient(135deg,#25d366,#128c7e)" : "#e5e7eb",
        color: valid ? "#fff" : "#9ca3af",
        fontSize: size === "sm" ? 12 : 13, fontWeight: 700,
        cursor: valid ? "pointer" : "not-allowed", whiteSpace: "nowrap",
      }}
    >
      <WhatsAppLogo size={iconSize} color="#fff" /> {label}
    </button>
  );
};

export default WhatsAppButton;
