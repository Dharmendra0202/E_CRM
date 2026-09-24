import { useState } from "react";

interface DownloadButtonProps {
  onClick?: () => void;
  label?: string;
  width?: number;   // resting width of the button
  height?: number;
}

/**
 * Animated download button — icon panel slides across and covers the label on hover.
 * Pure inline styles (no styled-components dependency).
 */
export function DownloadButton({ onClick, label = "Download", width = 190, height = 40 }: DownloadButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const iconPanelW = 39;
  const trans = "all 0.3s";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        // Secondary / utility treatment: neutral outline so it reads as a
        // supporting action next to the blue primary (e.g. "New Enquiry").
        border: "1px solid hsla(285,30%,20%,0.15)",
        background: hover ? "hsl(320,20%,94%)" : "#fff",
        overflow: "hidden",
        borderRadius: "8px",
        padding: 0,
        transition: trans,
        fontFamily: "inherit",
      }}
    >
      {/* Text */}
      <span
        style={{
          transform: "translateX(22px)",
          color: hover ? "transparent" : "#343a40",
          fontWeight: 600,
          fontSize: "14px",
          transition: trans,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Icon panel */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: hover ? `${width - 2}px` : `${iconPanelW}px`,
          transform: hover ? "translateX(0)" : `translateX(${width - iconPanelW - 2}px)`,
          background: active ? "hsl(320,20%,88%)" : "hsl(320,20%,92%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: trans,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" style={{ width: "20px", fill: "#343a40" }}>
          <path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z" />
          <path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z" />
          <path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z" />
        </svg>
      </span>
    </button>
  );
}
