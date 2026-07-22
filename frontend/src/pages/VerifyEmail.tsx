import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import { GraduationCap, CheckCircle2, XCircle, Loader } from "lucide-react";

export const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid verification link."); return; }
    api.auth.verifyEmail(token)
      .then(res => { setStatus("success"); setMessage(res.message || "Email verified!"); })
      .catch(err => { setStatus("error"); setMessage(err.message || "Link expired or invalid."); });
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,hsl(320,30%,98%),hsl(280,30%,97%))", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 8px 40px -8px rgba(29,10,39,0.12)" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>E-CRM Portal</p>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase" }}>Academy Management</p>
          </div>
        </div>

        {status === "loading" && (
          <>
            <Loader size={48} style={{ color: "hsl(271,91%,60%)", animation: "btnSpinnerRotate 1s linear infinite", marginBottom: "20px" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Verifying your email...</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={56} style={{ color: "var(--color-success)", marginBottom: "20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 12px", color: "var(--text-primary)" }}>Email Verified! 🎉</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>{message}</p>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", color: "#fff", textDecoration: "none", padding: "13px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, boxShadow: "0 6px 20px hsla(328,100%,54%,0.35)" }}>
              Go to Dashboard →
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={56} style={{ color: "var(--color-danger)", marginBottom: "20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 12px", color: "var(--text-primary)" }}>Verification Failed</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>{message}</p>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1.5px solid var(--border-glass)", color: "var(--text-primary)", textDecoration: "none", padding: "13px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 700 }}>
              ← Back to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
};
