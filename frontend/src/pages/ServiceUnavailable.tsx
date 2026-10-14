import React from "react";
import { RefreshCw } from "lucide-react";

/**
 * Shown when the app cannot reach the backend OR the database is unavailable
 * (e.g. the Supabase free-tier project is paused and still waking up).
 *
 * This replaces the old behaviour where a raw Prisma error
 * ("Can't reach database server at aws-0-ap-northeast-1...") leaked straight
 * into the login screen. It reuses the same arctic artwork as the 404 page so
 * the two error states feel consistent, and offers a Retry action.
 */
export function ServiceUnavailable({
  reason = "db",
  onRetry,
  retrying = false,
}: {
  /** "db" = database waking up, "network" = backend unreachable. */
  reason?: "db" | "network";
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const heading = reason === "network" ? "Can't reach the server" : "Waking things up";
  const detail =
    reason === "network"
      ? "We couldn't connect to the server. Check that it's running and that you're online, then try again."
      : "The service is temporarily unavailable because the database is starting back up. This usually takes under a minute. Please wait a moment and try again.";

  return (
    <div style={styles.page}>
      <div style={styles.art}>
        <img
          src={encodeURI("/404 page.png")}
          alt=""
          aria-hidden="true"
          style={styles.image}
        />

        {/* Message + retry overlaid on the lower-centre of the illustration so
            it reads as part of the scene. Percent units keep it aligned as the
            artwork scales on any screen size. */}
        <div style={styles.overlay}>
          <h1 style={styles.heading}>{heading}</h1>
          <p style={styles.detail}>{detail}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              style={{ ...styles.button, opacity: retrying ? 0.7 : 1, cursor: retrying ? "default" : "pointer" }}
            >
              <RefreshCw
                size={16}
                style={{ animation: retrying ? "btnSpinnerRotate 0.8s linear infinite" : "none" }}
              />
              {retrying ? "Retrying…" : "Try Again"}
            </button>
          )}
        </div>
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
    background: "#bfe4fb",
    overflow: "hidden",
  },
  art: {
    position: "relative",
    width: "100%",
    maxWidth: "1500px",
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
  overlay: {
    position: "absolute",
    left: "50%",
    top: "60%",
    transform: "translate(-50%, -50%)",
    width: "min(90%, 460px)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  heading: {
    margin: 0,
    fontSize: "clamp(20px, 3.2vw, 30px)",
    fontWeight: 800,
    color: "#1e3a5f",
    fontFamily: "'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
  },
  detail: {
    margin: 0,
    fontSize: "clamp(12px, 1.7vw, 15px)",
    color: "#30506e",
    lineHeight: 1.5,
    fontFamily: "'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
  },
  button: {
    marginTop: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #007bff, #0069d9)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "11px 24px",
    fontSize: "14px",
    fontWeight: 700,
    boxShadow: "0 4px 14px rgba(0,90,200,0.3)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
};
