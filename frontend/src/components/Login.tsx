import React, { useState, useEffect, useCallback, useRef } from "react";
import { api, setToken } from "../utils/api";
import {
  Mail, Lock, User, ArrowRight, Eye, EyeOff,
  Sparkles, CheckCircle2, RefreshCw, KeyRound, Zap,
} from "lucide-react";

interface LoginProps { onLoginSuccess: (sessionUser: any) => void; }
type Tab = "login" | "signup" | "forgot";
type Screen = "form" | "verify" | "reset_sent";

const ACCENT = "#007bff";
const ACCENT_DARK = "#0069d9";

const inputBase: React.CSSProperties = {
  width: "100%", height: "44px", borderRadius: "10px",
  border: "1.5px solid #dfe3ea",
  background: "#fff", fontSize: "14px",
  color: "#2b2f36", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<Tab>("login");
  const [screen, setScreen] = useState<Screen>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setRL] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingEmail, setPE] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  // ── Cloud mascot state ──────────────────────────────────
  const [isTyping, setIsTyping] = useState(false); // password focused → eyes shut
  const [blink, setBlink] = useState(false);
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const faceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const el = faceRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 300));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 300));
      setEyePos({ x: dx * 8, y: dy * 4 });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const demoLogin = async () => {
    setLoading(true);
    showToast("Launching Demo Mode...", "info");
    try {
      const res = await api.auth.demoLogin();
      if (res.token) setToken(res.token);
      onLoginSuccess({
        id: res.user?.id || "demo-user",
        email: res.user?.email || "demo@ecrm.com",
        role: res.user?.role || "ADMIN",
        user_metadata: { name: res.user ? `${res.user.firstName} ${res.user.lastName}` : "Dharmendra Admin", role: res.user?.role || "ADMIN" },
      });
    } catch {
      setToken("demo-offline-token");
      onLoginSuccess({ id: "demo-user", email: "demo@ecrm.com", user_metadata: { name: "Dharmendra Admin", role: "ADMIN" } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (tab === "login") {
        const res = await api.auth.login(email, password);
        setToken(res.token);
        onLoginSuccess({ ...res.user, user_metadata: { name: `${res.user.firstName} ${res.user.lastName}`, role: res.user.role } });
      } else if (tab === "signup") {
        const parts = name.trim().split(" ");
        await api.auth.register({ email, password, firstName: parts[0], lastName: parts.slice(1).join(" ") || parts[0], role, phone: "" });
        setPE(email);
        setScreen("verify");
      } else {
        await api.auth.forgotPassword(email);
        setScreen("reset_sent");
      }
    } catch (err: any) {
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        showToast("Backend server unreachable. Launching Demo Mode...", "info");
        demoLogin();
        return;
      }
      if (err.message?.toLowerCase().includes("verify")) { setPE(email); setScreen("verify"); setLoading(false); return; }
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setRL(true);
    try { await api.auth.resendVerification(pendingEmail || email); showToast("Verification email resent!", "success"); }
    catch { showToast("Failed to resend. Try again.", "error"); }
    finally { setRL(false); }
  };

  const switchTab = (t: Tab) => { setTab(t); setErrorMsg(""); setScreen("form"); };

  // ── Google Sign-In ─────────────────────────────────────────
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleGoogleResponse = useCallback(async (response: any) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.auth.google(response.credential);
      setToken(res.token);
      onLoginSuccess({ ...res.user, user_metadata: { name: `${res.user.firstName} ${res.user.lastName}`, role: res.user.role } });
    } catch (err: any) {
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        showToast("Backend server unreachable. Launching Demo Mode...", "info");
        demoLogin();
        return;
      }
      setErrorMsg(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }, [onLoginSuccess]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const existingScript = document.getElementById("google-gsi-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleButton();
      document.head.appendChild(script);
    } else {
      initGoogleButton();
    }
    function initGoogleButton() {
      if (!(window as any).google) return;
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      const btnContainer = document.getElementById("google-signin-btn");
      if (btnContainer) {
        (window as any).google.accounts.id.renderButton(btnContainer, {
          theme: "outline", size: "large", width: "320", text: "continue_with", shape: "pill",
        });
      }
    }
  }, [GOOGLE_CLIENT_ID, handleGoogleResponse, tab, screen]);

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#dfe3ea"; e.target.style.boxShadow = "none"; };

  // ── Cloud mascot render ─────────────────────────────────
  const Eye_ = ({ side }: { side: "left" | "right" }) => {
    // Eye is absolutely positioned over the watercolor cloud image.
    const closed = isTyping;
    const h = closed ? 3 : blink ? 5 : 30;
    return (
      <div style={{
        position: "absolute", top: "44px",
        left: side === "left" ? "58px" : "108px",
        width: "20px", height: `${h}px`,
        borderRadius: closed || blink ? "2px" : "50% / 60%",
        background: closed ? "#000" : "#fff",
        transition: "all 0.15s ease",
        overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {!closed && (
          <div style={{
            width: "12px", height: "12px", borderRadius: "50%", background: "#000",
            marginBottom: "3px",
            transform: `translate(${eyePos.x}px, 0px)`,
            transition: "transform 0.1s ease",
          }} />
        )}
      </div>
    );
  };

  const CloudMascot = () => (
    <div ref={faceRef} style={{ position: "relative", width: "200px", height: "114px", margin: "0 auto" }}>
      <img
        src="/2e429af66b2ad5c13c11326bead739b6e7746470c7af7ac4fd7892d0190b4ab8.jpg"
        alt="cloud mascot"
        style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
      />
      <Eye_ side="left" />
      <Eye_ side="right" />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "var(--font-family)",
      background: "linear-gradient(135deg, #eef1fb 0%, #e7eefb 50%, #eaf4fb 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {toast && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "8px", zIndex: 100,
          background: "#fff", padding: "10px 18px", borderRadius: "10px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)", color: ACCENT,
        }}>
          <Sparkles size={15} />
          <span style={{ fontSize: "13px", fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderRadius: "18px", boxShadow: "0 20px 60px -12px rgba(90,97,105,0.3)",
        border: "1px solid rgba(255,255,255,0.6)", padding: "22px 26px 24px",
      }}>
        {/* Mascot */}
        <CloudMascot />

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 3px", color: "#2b2f36" }}>
            {screen !== "form" ? "E-CRM Portal"
              : tab === "login" ? "Welcome back" : tab === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p style={{ fontSize: "13px", color: "#6c757d", margin: 0 }}>
            {screen !== "form" ? "Academy Management System"
              : tab === "login" ? "Sign in to continue" : tab === "signup" ? "Register a new account" : "We'll email you a reset link"}
          </p>
        </div>

        {/* ── VERIFY EMAIL ── */}
        {screen === "verify" && (
          <div className="animate-fade-in" style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "hsla(142,70%,42%,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={30} style={{ color: "hsl(142,70%,40%)" }} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px" }}>Check your email</h2>
            <p style={{ fontSize: "13px", color: "#6c757d", margin: "0 0 4px" }}>Verification link sent to</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: ACCENT, margin: "0 0 18px" }}>{pendingEmail || email}</p>
            <button onClick={resend} disabled={resendLoading}
              style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 auto 14px", background: "none", border: "1.5px solid #dfe3ea", borderRadius: "10px", padding: "9px 18px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#2b2f36" }}>
              <RefreshCw size={14} style={{ animation: resendLoading ? "btnSpinnerRotate 0.8s linear infinite" : "none" }} />
              {resendLoading ? "Sending..." : "Resend verification email"}
            </button>
            <button onClick={() => { setScreen("form"); switchTab("login"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: ACCENT, fontWeight: 600 }}>← Back to Sign In</button>
          </div>
        )}

        {/* ── RESET SENT ── */}
        {screen === "reset_sent" && (
          <div className="animate-fade-in" style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `${ACCENT}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <KeyRound size={30} style={{ color: ACCENT }} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px" }}>Reset link sent</h2>
            <p style={{ fontSize: "13px", color: "#6c757d", margin: "0 0 18px", lineHeight: 1.6 }}>Check your inbox for a password reset link. It expires in 1 hour.</p>
            <button onClick={() => { setScreen("form"); switchTab("login"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: ACCENT, fontWeight: 600 }}>← Back to Sign In</button>
          </div>
        )}

        {/* ── MAIN FORM ── */}
        {screen === "form" && (
          <>
            {errorMsg && (
              <div className="animate-fade-in" style={{ background: "hsla(205, 85%, 50%,0.08)", border: "1px solid hsla(205, 85%, 50%,0.25)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", color: "hsl(205, 85%, 50%)", marginBottom: "16px" }}>
                {errorMsg}
              </div>
            )}

            {tab !== "forgot" && (
              <div style={{ display: "flex", gap: "6px", background: "#eef0f5", padding: "4px", borderRadius: "10px", marginBottom: "16px" }}>
                {(["login", "signup"] as Tab[]).map((t) => (
                  <button key={t} type="button" onClick={() => switchTab(t)}
                    style={{ flex: 1, padding: "9px", borderRadius: "7px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                      background: tab === t ? "#fff" : "transparent", color: tab === t ? ACCENT : "#6c757d",
                      boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                    {t === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="on" style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {tab === "signup" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#60686f", display: "block", marginBottom: "6px" }}>Full Name</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#98a0a8", display: "flex", pointerEvents: "none" }}><User size={16} /></span>
                    <input type="text" autoComplete="name" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)}
                      style={{ ...inputBase, padding: "0 14px 0 40px" }} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#60686f", display: "block", marginBottom: "6px" }}>Email</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#98a0a8", display: "flex", pointerEvents: "none" }}><Mail size={16} /></span>
                  <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                    style={{ ...inputBase, padding: "0 14px 0 40px" }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {tab !== "forgot" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#60686f" }}>Password</label>
                    {tab === "login" && (
                      <span onClick={() => switchTab("forgot")} style={{ fontSize: "12px", color: ACCENT, cursor: "pointer", fontWeight: 600 }}>Forgot?</span>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#98a0a8", display: "flex", pointerEvents: "none" }}><Lock size={16} /></span>
                    <input type={showPass ? "text" : "password"} autoComplete={tab === "login" ? "current-password" : "new-password"} placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={{ ...inputBase, padding: "0 42px 0 40px" }}
                      onFocus={(e) => { setIsTyping(true); onFocus(e); }}
                      onBlur={(e) => { setIsTyping(false); onBlur(e); }} />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#98a0a8", display: "flex", padding: 0 }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {tab === "signup" && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#98a0a8" }}>Min 8 chars · one uppercase · one number</p>}
                </div>
              )}

              {tab === "signup" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#60686f", display: "block", marginBottom: "7px" }}>Role</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                    {["ADMIN", "TEACHER", "STUDENT"].map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        style={{ padding: "9px", fontSize: "12px", fontWeight: 700, borderRadius: "9px", border: `1.5px solid ${role === r ? ACCENT : "#dfe3ea"}`, background: role === r ? `${ACCENT}0f` : "transparent", color: role === r ? ACCENT : "#6c757d", cursor: "pointer", transition: "all 0.2s" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ height: "48px", borderRadius: "12px", border: "none", background: loading ? "#c8cdd6" : `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", boxShadow: loading ? "none" : `0 6px 18px ${ACCENT}44`, width: "100%" }}>
                {loading
                  ? <><span style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "btnSpinnerRotate 0.6s linear infinite", display: "inline-block" }} />Processing...</>
                  : <>{tab === "login" ? "Sign In" : tab === "signup" ? "Create Account" : "Send Reset Link"} <ArrowRight size={16} /></>}
              </button>

              {tab === "forgot" && (
                <button type="button" onClick={() => switchTab("login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: ACCENT, fontWeight: 600, textAlign: "center" }}>← Back to Sign In</button>
              )}
            </form>

            {tab !== "forgot" && (
              <>
                <div style={{ display: "flex", alignItems: "center", margin: "14px 0", gap: "12px" }}>
                  <div style={{ flex: 1, height: "1px", background: "#e2e6ec" }} />
                  <span style={{ fontSize: "11px", color: "#98a0a8", fontWeight: 700, letterSpacing: "1px" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", background: "#e2e6ec" }} />
                </div>

                {GOOGLE_CLIENT_ID && (
                  <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }} />
                )}

                <button type="button" onClick={demoLogin} disabled={loading}
                  style={{ width: "100%", height: "44px", borderRadius: "10px", border: "1.5px solid #dfe3ea", background: "#fff", color: "#2b2f36", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ACCENT; (e.currentTarget as HTMLElement).style.color = ACCENT; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#dfe3ea"; (e.currentTarget as HTMLElement).style.color = "#2b2f36"; }}>
                  <Zap size={15} style={{ color: ACCENT }} /> Launch Demo Mode
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
