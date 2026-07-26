import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";
import { io as socketIO } from "socket.io-client";

type WAStatus = "ready" | "qr" | "initializing" | "disconnected" | "auth_failure" | "loading";

interface WAState {
  status: WAStatus;
  isReady: boolean;
  isInitializing: boolean;
  hasQR: boolean;
  qrImage?: string | null;
}

/**
 * Compact WhatsApp connection widget to embed inside the Add Student form.
 * Shows connection status + QR code if needed, so the admin can link their
 * WhatsApp before enrolling a student. Once connected, messages fire automatically.
 */
export const WhatsAppStatusWidget: React.FC = () => {
  const [wa, setWa] = useState<WAState>({
    status: "loading", isReady: false, isInitializing: false, hasQR: false,
  });
  const [expanded, setExpanded] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await api.whatsapp.getStatus();
      const s = res.data as WAState;
      const next: WAState = { ...s };
      if (s.hasQR && !s.isReady) {
        try {
          const qrRes = await api.whatsapp.getQR();
          next.qrImage = qrRes.data?.qr ?? null;
        } catch { next.qrImage = null; }
        setExpanded(true); // auto-open QR when needed
      }
      setWa(next);
    } catch {
      setWa(prev => ({ ...prev, status: "disconnected", isReady: false }));
    }
  }, []);

  // Socket.IO real-time updates
  useEffect(() => {
    refresh();
    const socket = socketIO("http://localhost:5000", { transports: ["websocket"] });
    socket.on("whatsapp_status", (data: any) => {
      setWa(prev => ({
        ...prev,
        status: data.status,
        isReady: data.isReady,
        hasQR: data.status === "qr",
        qrImage: data.status !== "qr" ? null : prev.qrImage,
      }));
      if (data.status === "qr") refresh();
    });
    socket.on("whatsapp_qr", () => refresh());
    return () => { socket.disconnect(); };
  }, [refresh]);

  // Poll while QR is pending or initializing
  useEffect(() => {
    if (wa.status !== "qr" && wa.status !== "initializing") return;
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [wa.status, refresh]);

  const handleConnect = async () => {
    setRestarting(true);
    try { await api.whatsapp.restart(); setTimeout(refresh, 3000); } catch { /**/ }
    finally { setRestarting(false); }
  };

  // ── Render based on status ──────────────────────────────────────────────────
  if (wa.status === "loading") return null;

  // Connected — show a slim green badge
  if (wa.status === "ready") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#f0fdf4", border: "1.5px solid #bbf7d0",
        borderRadius: 12, padding: "10px 16px",
      }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#15803d" }}>
            WhatsApp Connected
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#166534" }}>
            Welcome message will be sent to the student automatically after enrollment.
          </p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 800, color: "#15803d",
          background: "#dcfce7", border: "1px solid #bbf7d0",
          padding: "2px 8px", borderRadius: 20,
        }}>LIVE</span>
      </div>
    );
  }

  // Initializing
  if (wa.status === "initializing") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#eff6ff", border: "1.5px solid #bfdbfe",
        borderRadius: 12, padding: "10px 16px",
      }}>
        <span style={{ fontSize: 16, animation: "waSpinWidget 1.5s linear infinite", display: "inline-block" }}>🔄</span>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>
          Connecting to WhatsApp... please wait.
        </p>
        <style>{`@keyframes waSpinWidget{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // QR code needed — expand to show QR
  if (wa.status === "qr") {
    return (
      <div style={{
        background: "#fffbeb", border: "1.5px solid #fde68a",
        borderRadius: 14, overflow: "hidden",
      }}>
        {/* Header row */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            cursor: "pointer", userSelect: "none",
          }}
          onClick={() => setExpanded(v => !v)}
        >
          <span style={{ fontSize: 18 }}>📱</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#92400e" }}>
              WhatsApp Not Connected
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#78350f" }}>
              Scan the QR below to enable auto WhatsApp messages on enrollment.
            </p>
          </div>
          <span style={{ fontSize: 16, color: "#b45309" }}>{expanded ? "▲" : "▼"}</span>
        </div>

        {/* QR code */}
        {expanded && (
          <div style={{ padding: "0 16px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "#78350f" }}>
              Open WhatsApp → <strong>Linked Devices</strong> → <strong>Link a Device</strong>
            </p>
            {wa.qrImage ? (
              <img
                src={wa.qrImage}
                alt="WhatsApp QR Code"
                style={{ width: 180, height: 180, borderRadius: 12, border: "2px solid #25d366", display: "inline-block" }}
              />
            ) : (
              <div style={{
                width: 180, height: 180, margin: "0 auto",
                background: "#fff", borderRadius: 12, border: "2px dashed #25d366",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: "#15803d",
              }}>
                Loading QR...
              </div>
            )}
            <p style={{ margin: "8px 0 0", fontSize: 10, color: "#92400e" }}>
              QR refreshes automatically. You only scan once — session is saved.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Disconnected / auth failure — show connect button
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#fef2f2", border: "1.5px solid #fecaca",
      borderRadius: 12, padding: "10px 16px",
    }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#b91c1c" }}>
          WhatsApp Not Connected
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#991b1b" }}>
          Student will NOT receive a WhatsApp message. Connect to enable auto-messaging.
        </p>
      </div>
      <button
        onClick={handleConnect}
        disabled={restarting}
        style={{
          height: 32, padding: "0 14px", borderRadius: 8, border: "none",
          background: restarting ? "#e5e7eb" : "linear-gradient(135deg,#25d366,#128c7e)",
          color: restarting ? "#9ca3af" : "#fff",
          fontSize: 11, fontWeight: 800, cursor: restarting ? "not-allowed" : "pointer",
          whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        {restarting ? "⏳..." : "🔗 Connect"}
      </button>
    </div>
  );
};

export default WhatsAppStatusWidget;
