import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

export const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (password !== confirm) { setErrorMsg("Passwords do not match."); return; }
    if (password.length < 8) { setErrorMsg("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password)) { setErrorMsg("Password must contain at least one uppercase letter."); return; }
    if (!/[0-9]/.test(password)) { setErrorMsg("Password must contain at least one number."); return; }
    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Reset failed.");
      setStatus("error");
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", height: "46px", padding: "0 44px 0 42px", borderRadius: "10px", border: "1.5px solid var(--border-glass)", background: "hsla(285,30%,98%,0.7)", fontSize: "14px", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,hsl(320,30%,98%),hsl(280,30%,97%))", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%", boxShadow: "0 8px 40px -8px rgba(29,10,39,0.12)" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>E-CRM Portal</p>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase" }}>Academy Management</p>
          </div>
        </div>

        {status === "success" && (
          <div style={{ textAlign: "center" }}>
            <CheckCircle2 size={56} style={{ color: "var(--color-success)", marginBottom: "20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 12px" }}>Password Reset!</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>Your password has been updated. You can now sign in.</p>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", color: "#fff", textDecoration: "none", padding: "13px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, boxShadow: "0 6px 20px hsla(328,100%,54%,0.35)" }}>
              Sign In →
            </a>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center" }}>
            <XCircle size={56} style={{ color: "var(--color-danger)", marginBottom: "20px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 12px" }}>Link Expired</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>{errorMsg}</p>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1.5px solid var(--border-glass)", color: "var(--text-primary)", textDecoration: "none", padding: "13px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 700 }}>
              ← Request New Link
            </a>
          </div>
        )}

        {status === "form" && (
          <>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px" }}>Set new password</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 28px" }}>Choose a strong password for your account.</p>
            {errorMsg && <div style={{ background: "hsla(342,90%,48%,0.08)", border: "1px solid hsla(342,90%,48%,0.25)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", color: "var(--color-danger)", marginBottom: "16px" }}>{errorMsg}</div>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>New Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "var(--text-secondary)", display: "flex" }}><Lock size={16} /></span>
                  <input type={showPass ? "text" : "password"} placeholder="Min 8 chars, 1 uppercase, 1 number" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "var(--color-accent)")} onBlur={e => (e.target.style.borderColor = "var(--border-glass)")} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "14px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 0 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Confirm Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "var(--text-secondary)", display: "flex" }}><Lock size={16} /></span>
                  <input type={showPass ? "text" : "password"} placeholder="Re-enter your password" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ ...inputStyle, paddingRight: "14px" }}
                    onFocus={e => (e.target.style.borderColor = "var(--color-accent)")} onBlur={e => (e.target.style.borderColor = "var(--border-glass)")} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ height: "50px", borderRadius: "12px", border: "none", background: loading ? "hsl(285,20%,80%)" : "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: loading ? "none" : "0 6px 20px hsla(328,100%,54%,0.35)", marginTop: "4px" }}>
                {loading ? <><span style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "btnSpinnerRotate 0.6s linear infinite", display: "inline-block" }} />Updating...</> : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
