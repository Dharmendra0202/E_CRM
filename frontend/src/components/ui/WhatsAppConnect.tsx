import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";
import { io as socketIO } from "socket.io-client";
import { RefreshCw, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { WhatsAppLogo } from "./WhatsAppLogo";

type WAStatus = "ready" | "qr" | "initializing" | "disconnected" | "auth_failure" | "loading";

interface WAState {
  status: WAStatus;
  isReady: boolean;
  isInitializing: boolean;
  hasQR: boolean;
  qrImage?: string | null;
}

/**
 * WhatsApp connection panel — scan the QR once to link your WhatsApp, then the
 * app can send messages. Shows live status + a test-message sender.
 */
export const WhatsAppConnect: React.FC = () => {
  const [wa, setWa] = useState<WAState>({ status: "loading", isReady: false, isInitializing: false, hasQR: false });
  const [restarting, setRestarting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Hello from our coaching center! This is a test message.");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

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
      }
      setWa(next);
    } catch {
      setWa(prev => ({ ...prev, status: "disconnected", isReady: false }));
    }
  }, []);

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

  // Poll frequently while QR is pending so the displayed code stays fresh (avoids "couldn't link").
  useEffect(() => {
    if (wa.status !== "qr" && wa.status !== "initializing") return;
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [wa.status, refresh]);

  const handleConnect = async () => {
    setRestarting(true);
    try { await api.whatsapp.restart(); setTimeout(refresh, 3000); } catch { /**/ }
    finally { setTimeout(() => setRestarting(false), 3000); }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim() || !testMsg.trim()) {
      setFeedback({ ok: false, text: "Enter a phone number and a message." });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      await api.whatsapp.sendTest({ phone: testPhone.trim(), message: testMsg.trim() });
      setFeedback({ ok: true, text: "Test message sent successfully!" });
    } catch (e: any) {
      setFeedback({ ok: false, text: e?.message || "Failed to send message." });
    } finally {
      setSending(false);
    }
  };

  const statusBadge = () => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      ready:        { bg: "#dcfce7", color: "#15803d", label: "Connected" },
      qr:           { bg: "#fef3c7", color: "#b45309", label: "Scan QR to connect" },
      initializing: { bg: "#dbeafe", color: "#1d4ed8", label: "Connecting..." },
      disconnected: { bg: "#fee2e2", color: "#b91c1c", label: "Disconnected" },
      auth_failure: { bg: "#fee2e2", color: "#b91c1c", label: "Auth failed" },
      loading:      { bg: "#e5e7eb", color: "#6b7280", label: "Loading..." },
    };
    const m = map[wa.status] || map.loading;
    return <span style={{ fontSize: 11, fontWeight: 800, background: m.bg, color: m.color, padding: "3px 10px", borderRadius: 20 }}>{m.label}</span>;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <WhatsAppLogo size={22} /> WhatsApp Connection
        </h3>
        {statusBadge()}
      </div>

      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
        Link your WhatsApp to send fee reminders, attendance alerts, and updates to students and parents. Scan the QR once — the session is saved, so you won't scan again.
      </p>

      {/* Connected */}
      {wa.status === "ready" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          <CheckCircle2 size={24} style={{ color: "#15803d" }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#15803d" }}>WhatsApp is connected and live.</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#166534" }}>The app can now send messages automatically.</p>
          </div>
        </div>
      )}

      {/* QR / connecting */}
      {(wa.status === "qr" || wa.status === "initializing") && (
        <div style={{ textAlign: "center", background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#92400e" }}>
            On your phone: <strong>WhatsApp → Settings → Linked Devices → Link a Device</strong>, then scan:
          </p>
          {wa.qrImage ? (
            <img src={wa.qrImage} alt="WhatsApp QR Code" style={{ width: 260, height: 260, borderRadius: 14, border: "3px solid #25D366", background: "#fff", display: "inline-block" }} />
          ) : (
            <div style={{ width: 260, height: 260, margin: "0 auto", background: "#fff", borderRadius: 14, border: "3px dashed #25D366", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#15803d", fontSize: 13 }}>
              <RefreshCw size={22} style={{ animation: "waSpin 1.2s linear infinite" }} />
              Generating QR...
            </div>
          )}
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "#92400e" }}>Scan quickly — the QR rotates. Keep your phone online after linking.</p>
          <style>{`@keyframes waSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Disconnected */}
      {(wa.status === "disconnected" || wa.status === "auth_failure") && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          <AlertTriangle size={22} style={{ color: "#b91c1c", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#b91c1c" }}>Not connected</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#991b1b" }}>Click connect to generate a QR code.</p>
          </div>
        </div>
      )}

      <button onClick={handleConnect} disabled={restarting}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none",
          background: restarting ? "#e5e7eb" : "linear-gradient(135deg,#25D366,#128C7E)", color: restarting ? "#9ca3af" : "#fff",
          fontSize: 13, fontWeight: 800, cursor: restarting ? "not-allowed" : "pointer", marginBottom: 26 }}>
        <WhatsAppLogo size={16} color="#fff" />
        {wa.status === "ready" ? "Reconnect / Change Number" : restarting ? "Connecting..." : "Connect WhatsApp"}
      </button>

      {/* Test sender */}
      <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: 20 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Send a test message</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}>
          <input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="Phone number e.g. 9876543210"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }} />
          <textarea value={testMsg} onChange={e => setTestMsg(e.target.value)} rows={3}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", resize: "vertical" }} />
          <button onClick={handleSendTest} disabled={sending || !wa.isReady}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none",
              background: (!wa.isReady || sending) ? "#e5e7eb" : "linear-gradient(135deg,#007bff,#0069d9)", color: (!wa.isReady || sending) ? "#9ca3af" : "#fff",
              fontSize: 13, fontWeight: 800, cursor: (!wa.isReady || sending) ? "not-allowed" : "pointer", width: "fit-content" }}>
            <Send size={15} /> {sending ? "Sending..." : "Send Test"}
          </button>
          {!wa.isReady && <p style={{ margin: 0, fontSize: 12, color: "#b45309" }}>Connect WhatsApp first to enable sending.</p>}
          {feedback && <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: feedback.ok ? "#15803d" : "#b91c1c" }}>{feedback.text}</p>}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConnect;
