import React, { useState } from "react";
import { api, setToken } from "../utils/api";
import {
  GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff,
  Brain, Lightbulb, Trophy, Puzzle, BookOpen, Sparkles, Zap,
  CheckCircle2, RefreshCw, KeyRound
} from "lucide-react";

interface LoginProps { onLoginSuccess: (sessionUser: any) => void; }
type Tab    = "login" | "signup" | "forgot";
type Screen = "form" | "verify" | "reset_sent";

const inputBase: React.CSSProperties = {
  width: "100%", height: "46px", borderRadius: "10px",
  border: "1.5px solid hsla(285,30%,20%,0.1)",
  background: "hsla(285,30%,98%,0.7)", fontSize: "14px",
  color: "hsl(285,50%,12%)", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.2s ease",
};

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [tab, setTab]             = useState<Tab>("login");
  const [screen, setScreen]       = useState<Screen>("form");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [name, setName]           = useState("");
  const [role, setRole]           = useState("ADMIN");
  const [loading, setLoading]     = useState(false);
  const [resendLoading, setRL]    = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [pendingEmail, setPE]     = useState("");
  const [toast, setToast]         = useState<{msg:string;type:string}|null>(null);

  const showToast = (msg: string, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const demoLogin = () => {
    setLoading(true);
    showToast("Launching Demo Mode...", "info");
    setTimeout(() => {
      onLoginSuccess({ id: "demo-user", email: "demo@ecrm.com", user_metadata: { name: "Dharmendra Admin", role: "ADMIN" } });
      setLoading(false);
    }, 900);
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
      if (err.message?.includes("fetch") || err.message?.includes("Failed")) { demoLogin(); return; }
      if (err.message?.toLowerCase().includes("verify")) { setPE(email); setScreen("verify"); setLoading(false); return; }
      setErrorMsg(err.message || "Authentication error.");
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

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "hsl(328,100%,54%)"; };
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "hsla(285,30%,20%,0.1)"; };

  return (
    <div className="login-root">
      {toast && (
        <div className={`login-toast login-toast-${toast.type}`}>
          <Sparkles size={15} />
          <span style={{ fontSize: "13px", fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* ── LEFT PANE ── */}
      <div className="login-left-pane">
        <div className="login-form-card">

          {/* Logo */}
          <div className="login-logo-container">
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px hsla(328,100%,54%,0.35)" }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }} className="text-gradient-indigo">E-CRM Portal</h2>
              <p style={{ fontSize: "10px", margin: 0, letterSpacing: "1.5px", textTransform: "uppercase", color: "hsl(285,20%,45%)" }}>Academy Management System</p>
            </div>
          </div>

          {/* ── VERIFY EMAIL SCREEN ── */}
          {screen === "verify" && (
            <div className="animate-fade-in" style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "hsla(142,70%,42%,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <CheckCircle2 size={34} style={{ color: "hsl(142,70%,40%)" }} />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 10px" }}>Check your email</h2>
              <p style={{ fontSize: "14px", color: "hsl(285,20%,45%)", margin: "0 0 6px" }}>Verification link sent to</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "hsl(328,100%,54%)", margin: "0 0 20px" }}>{pendingEmail || email}</p>
              <p style={{ fontSize: "13px", color: "hsl(285,20%,45%)", margin: "0 0 24px", lineHeight: 1.6 }}>Click the link in the email to verify, then sign in here.</p>
              <button onClick={resend} disabled={resendLoading}
                style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 auto 16px", background: "none", border: "1.5px solid hsla(285,30%,20%,0.1)", borderRadius: "10px", padding: "10px 20px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "hsl(285,50%,12%)" }}>
                <RefreshCw size={14} style={{ animation: resendLoading ? "btnSpinnerRotate 0.8s linear infinite" : "none" }} />
                {resendLoading ? "Sending..." : "Resend verification email"}
              </button>
              <button onClick={() => { setScreen("form"); switchTab("login"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "hsl(328,100%,54%)", fontWeight: 600 }}>← Back to Sign In</button>
            </div>
          )}

          {/* ── RESET SENT SCREEN ── */}
          {screen === "reset_sent" && (
            <div className="animate-fade-in" style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "hsla(271,91%,60%,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <KeyRound size={34} style={{ color: "hsl(271,91%,60%)" }} />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 10px" }}>Reset link sent</h2>
              <p style={{ fontSize: "14px", color: "hsl(285,20%,45%)", margin: "0 0 24px", lineHeight: 1.6 }}>Check your inbox for a password reset link. It expires in 1 hour.</p>
              <button onClick={() => { setScreen("form"); switchTab("login"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "hsl(328,100%,54%)", fontWeight: 600 }}>← Back to Sign In</button>
            </div>
          )}

          {/* ── MAIN FORM ── */}
          {screen === "form" && (
            <>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px", color: "hsl(285,50%,12%)" }}>
                  {tab === "login" ? "Welcome back 👋" : tab === "signup" ? "Create account" : "Reset password"}
                </h1>
                <p style={{ fontSize: "14px", color: "hsl(285,20%,45%)", margin: 0 }}>
                  {tab === "login" ? "Sign in to your academy dashboard." : tab === "signup" ? "Register a new portal account." : "Enter your email to get a reset link."}
                </p>
              </div>

              {errorMsg && (
                <div className="animate-fade-in" style={{ background: "hsla(342,90%,48%,0.08)", border: "1px solid hsla(342,90%,48%,0.25)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", color: "hsl(342,90%,48%)", marginBottom: "16px" }}>
                  {errorMsg}
                </div>
              )}

              {tab !== "forgot" && (
                <div className="login-tabs" style={{ marginBottom: "24px" }}>
                  <button type="button" className={`login-tab-btn ${tab === "login" ? "is-active" : ""}`} onClick={() => switchTab("login")}>Sign In</button>
                  <button type="button" className={`login-tab-btn ${tab === "signup" ? "is-active" : ""}`} onClick={() => switchTab("signup")}>Create Account</button>
                </div>
              )}

              <form onSubmit={handleSubmit} autoComplete="on" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Full Name — signup only */}
                {tab === "signup" && (
                  <div>
                    <label htmlFor="login-name" style={{ fontSize: "12px", fontWeight: 700, color: "hsl(285,20%,45%)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "hsl(285,20%,45%)", display: "flex", pointerEvents: "none" }}><User size={16} /></span>
                      <input id="login-name" name="name" type="text" autoComplete="name" placeholder="Dharmendra Kumar"
                        value={name} onChange={e => setName(e.target.value)}
                        style={{ ...inputBase, padding: "0 14px 0 42px" }}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="login-email" style={{ fontSize: "12px", fontWeight: 700, color: "hsl(285,20%,45%)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "hsl(285,20%,45%)", display: "flex", pointerEvents: "none" }}><Mail size={16} /></span>
                    <input id="login-email" name="email" type="email" autoComplete="email" placeholder="admin@academy.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{ ...inputBase, padding: "0 14px 0 42px" }}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* Password — login & signup only */}
                {tab !== "forgot" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label htmlFor="login-password" style={{ fontSize: "12px", fontWeight: 700, color: "hsl(285,20%,45%)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
                      {tab === "login" && (
                        <span onClick={() => switchTab("forgot")} style={{ fontSize: "12px", color: "hsl(328,100%,54%)", cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
                      )}
                    </div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "hsl(285,20%,45%)", display: "flex", pointerEvents: "none" }}><Lock size={16} /></span>
                      <input id="login-password" name="password" type={showPass ? "text" : "password"} autoComplete={tab === "login" ? "current-password" : "new-password"} placeholder="••••••••••"
                        value={password} onChange={e => setPassword(e.target.value)}
                        style={{ ...inputBase, padding: "0 44px 0 42px" }}
                        onFocus={onFocus} onBlur={onBlur} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "hsl(285,20%,45%)", display: "flex", padding: 0 }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {tab === "signup" && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "hsl(285,20%,45%)" }}>Min 8 chars · one uppercase · one number</p>}
                  </div>
                )}

                {/* Role selector — signup only */}
                {tab === "signup" && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "hsl(285,20%,45%)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Portal Role</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                      {["ADMIN", "TEACHER", "STUDENT"].map(r => (
                        <button key={r} type="button" onClick={() => setRole(r)}
                          style={{ padding: "9px", fontSize: "12px", fontWeight: 700, borderRadius: "10px", border: `1.5px solid ${role === r ? "hsl(328,100%,54%)" : "hsla(285,30%,20%,0.1)"}`, background: role === r ? "hsla(328,100%,54%,0.08)" : "transparent", color: role === r ? "hsl(328,100%,54%)" : "hsl(285,20%,45%)", cursor: "pointer", transition: "all 0.2s" }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{ height: "50px", borderRadius: "12px", border: "none", background: loading ? "hsl(285,20%,80%)" : "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", boxShadow: loading ? "none" : "0 6px 20px hsla(328,100%,54%,0.35)", width: "100%" }}>
                  {loading
                    ? <><span style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "btnSpinnerRotate 0.6s linear infinite", display: "inline-block" }} />Processing...</>
                    : <>{tab === "login" ? "SIGN IN" : tab === "signup" ? "CREATE ACCOUNT" : "SEND RESET LINK"} <ArrowRight size={16} /></>}
                </button>

                {tab === "forgot" && (
                  <button type="button" onClick={() => switchTab("login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "hsl(328,100%,54%)", fontWeight: 600, textAlign: "center" }}>← Back to Sign In</button>
                )}
              </form>

              {/* Demo access */}
              {tab !== "forgot" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", margin: "20px 0", gap: "12px" }}>
                    <div style={{ flex: 1, height: "1px", background: "hsla(285,30%,20%,0.08)" }} />
                    <span style={{ fontSize: "11px", color: "hsl(285,20%,45%)", fontWeight: 700, letterSpacing: "1px" }}>OR DEMO ACCESS</span>
                    <div style={{ flex: 1, height: "1px", background: "hsla(285,30%,20%,0.08)" }} />
                  </div>
                  <button type="button" onClick={demoLogin} disabled={loading}
                    style={{ width: "100%", height: "46px", borderRadius: "12px", border: "1.5px solid hsla(285,30%,20%,0.1)", background: "hsla(285,30%,98%,0.7)", color: "hsl(285,50%,12%)", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(328,100%,54%)"; (e.currentTarget as HTMLElement).style.color = "hsl(328,100%,54%)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(285,30%,20%,0.1)"; (e.currentTarget as HTMLElement).style.color = "hsl(285,50%,12%)"; }}>
                    <Zap size={15} style={{ color: "hsl(328,100%,54%)" }} /> Launch with Demo Mode
                  </button>
                  <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "hsl(285,20%,45%)" }}>
                    {tab === "login" ? "New here? " : "Already registered? "}
                    <span onClick={() => switchTab(tab === "login" ? "signup" : "login")} style={{ color: "hsl(328,100%,54%)", fontWeight: 700, cursor: "pointer" }}>
                      {tab === "login" ? "Create an account" : "Sign in"}
                    </span>
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right-pane" style={{ overflow: "hidden" }}>
        <svg className="cloud-divider-svg" viewBox="0 0 120 1000" preserveAspectRatio="none">
          <path d="M0,0 L60,0 C85,90 40,180 85,270 C120,360 70,450 95,540 C110,630 65,720 90,810 C105,900 70,950 80,1000 L0,1000 Z" fill="hsla(200,95%,50%,0.1)" />
          <path d="M0,0 L40,0 C65,80 30,170 65,260 C90,350 50,440 75,530 C90,620 50,710 70,800 C85,890 50,940 60,1000 L0,1000 Z" fill="#ffffff" />
        </svg>
        <div className="neon-floating-icons-layer">
          <div className="neon-symbol-wrapper symbol-brain neon-glow-pink"><Brain size={52} /></div>
          <div className="neon-symbol-wrapper symbol-bulb neon-glow-yellow"><Lightbulb size={38} /></div>
          <div className="neon-symbol-wrapper symbol-trophy neon-glow-pink"><Trophy size={44} /></div>
          <div className="neon-symbol-wrapper symbol-puzzle-1 neon-glow-purple"><Puzzle size={40} style={{ transform: "rotate(20deg)" }} /></div>
          <div className="neon-symbol-wrapper symbol-puzzle-2 neon-glow-green"><Puzzle size={30} style={{ transform: "rotate(-15deg)" }} /></div>
          <div className="neon-symbol-wrapper symbol-book neon-glow-purple"><BookOpen size={38} /></div>
          <div className="neon-symbol-wrapper symbol-grad-cap neon-glow-yellow"><GraduationCap size={42} /></div>
          <div className="neon-symbol-wrapper symbol-star-1 neon-glow-cyan"><Sparkles size={22} /></div>
          <div className="neon-symbol-wrapper symbol-star-2 neon-glow-yellow"><Sparkles size={30} /></div>
          <div className="neon-symbol-wrapper symbol-star-3 neon-glow-cyan"><Sparkles size={16} /></div>
          <div className="neon-symbol-wrapper symbol-star-4 neon-glow-yellow"><Sparkles size={20} /></div>
          <div className="neon-symbol-wrapper symbol-planet">
            <svg width="130" height="130" viewBox="-10 -10 140 140" overflow="visible" style={{ filter: "drop-shadow(0 0 15px hsla(328,100%,54%,0.6))" }}>
              <defs><radialGradient id="pG" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="hsl(328,100%,75%)" /><stop offset="60%" stopColor="hsl(328,100%,45%)" /><stop offset="100%" stopColor="hsl(244,49%,14%)" /></radialGradient></defs>
              <path d="M 5 65 A 58 18 15 0 1 115 52" fill="none" stroke="hsl(200,95%,65%)" strokeWidth="3.5" opacity="0.55" />
              <circle cx="60" cy="60" r="28" fill="url(#pG)" />
              <path d="M 115 52 A 58 18 15 0 1 5 65" fill="none" stroke="hsl(200,95%,65%)" strokeWidth="4" />
            </svg>
          </div>
        </div>
        <div className="rocket-universe-container">
          <div className="rocket-wrapper">
            <div className="exhaust-particles-emitter">{Array.from({ length: 10 }, (_, i) => <span key={i} className={`exhaust-bubble bubble-${i + 1}`} />)}</div>
            <svg className="rocket-svg-element" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="fG" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stopColor="hsl(38,92%,50%)" stopOpacity="1" /><stop offset="50%" stopColor="hsl(342,90%,48%)" stopOpacity="0.8" /><stop offset="100%" stopColor="hsl(271,91%,60%)" stopOpacity="0" /></linearGradient>
                <linearGradient id="ifG" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stopColor="#fff" stopOpacity="1" /><stop offset="60%" stopColor="hsl(38,92%,50%)" stopOpacity="0.8" /><stop offset="100%" stopColor="hsl(342,90%,48%)" stopOpacity="0" /></linearGradient>
              </defs>
              <g className="rocket-flame-path">
                <path d="M10,75 C-12,70 -30,73 -35,75 C-30,77 -12,80 10,75 Z" fill="url(#fG)" />
                <path d="M0,75 C-8,72 -20,74 -24,75 C-20,76 -8,78 0,75 Z" fill="url(#ifG)" />
              </g>
              <path d="M20,64 L30,64 L30,86 L20,86 Z" fill="#2c3e50" />
              <path d="M32,60 L24,40 L45,55 Z" fill="hsl(328,100%,54%)" />
              <path d="M32,90 L24,110 L45,95 Z" fill="hsl(328,100%,54%)" />
              <path d="M28,60 C40,48 95,46 115,75 C95,104 40,102 28,90 Z" fill="#fcfcfc" stroke="#d5dbdb" strokeWidth="2" />
              <path d="M90,56 C96,62 108,70 115,75 C108,80 96,88 90,94 C93,88 96,81 96,75 C96,69 93,62 90,56 Z" fill="hsl(200,95%,50%)" />
              <circle cx="68" cy="75" r="14" fill="#34495e" />
              <circle cx="68" cy="75" r="10" fill="#e8f8f5" />
              <path d="M62,70 A8,8 0 0,1 74,70 Z" fill="#fff" opacity="0.6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
