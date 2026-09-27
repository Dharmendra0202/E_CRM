import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * 404 page — arctic "Oops! Where are we?" illustration.
 *
 * The artwork lives at /404 page.png (in public/). We render it as a
 * responsive background so it scales with any screen size, and overlay
 * an interactive "Go Home" button positioned to match the illustration.
 *
 * A static, framework-free copy lives at public/404.html so host-level
 * fallbacks (static hosting / CDN / SPA rewrites) show the same page
 * instead of a raw error or stack trace.
 */
export function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* Responsive artwork. Keeps aspect ratio, scales to fit any viewport. */}
      <div style={styles.art}>
        <img
          src={encodeURI("/404 page.png")}
          alt="404 — the page you are looking for was moved, removed, renamed or might never have existed."
          style={styles.image}
        />

        {/* Interactive button overlaid on the illustration's "Go Home" area.
            Positioned in % so it tracks the artwork as it scales. */}
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Go Home"
          style={styles.button}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,90,200,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,90,200,0.3)";
          }}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // Sky-blue matches the illustration edges so letterboxing is seamless.
    background: "#bfe4fb",
    overflow: "hidden",
  },
  art: {
    position: "relative",
    width: "100%",
    maxWidth: "1500px",
    // Cap height so on tall/portrait screens the image doesn't overflow;
    // aspect-ratio keeps it from distorting.
    aspectRatio: "1512 / 1035",
    maxHeight: "100vh",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    userSelect: "none",
  },
  button: {
    position: "absolute",
    // Placed over the illustrated "Go Home" button. Values are % of the
    // artwork box so the hit-area scales with the image on any screen size.
    left: "8.2%",
    top: "42%",
    width: "18.5%",
    height: "7.5%",
    minWidth: "0",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
};
