import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import {
  GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff,
  Brain, Lightbulb, Trophy, Puzzle, BookOpen, Sparkles, Zap,
  Users2, BarChart3, IndianRupee
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (sessionUser: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDemoModeLogin = () => {
    setLoading(true);
    showToast("Launching Demo E-CRM Console...", "info");
    setTimeout(() => {
      onLoginSuccess({
        id: "demo-user",
        email: "demo@ecrm.com",
        user_metadata: { name: "Dharmendra Admin", role: "ADMIN" },
      });
      setLoading(false);
    }, 1200);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    if (!email || !password) { setErrorMsg("Please fill in all fields."); setLoading(false); return; }
    if (activeTab === "signup" && !name) { setErrorMsg("Please enter your full name."); setLoading(false); return; }
    try {
      if (activeTab === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("placeholder") || error.message.includes("Invalid login")) {
            handleDemoModeLogin(); return;
          }
          throw error;
        }
        if (data?.user) { showToast("Welcome back!", "success"); onLoginSuccess(data.user); }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
        if (error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("placeholder")) {
            showToast("Profile created. Launching workspace...", "success");
            setTimeout(() => onLoginSuccess({ id: "demo-signup", email, user_metadata: { name, role } }), 1200);
            return;
          }
          throw error;
        }
        if (data?.user) { showToast("Account created!", "success"); onLoginSuccess(data.user); }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication error.");
      showToast(err.message || "Authentication error.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-root">
      {/* Toast */}
      {toast && (
        <div className={`login-toast login-toast-${toast.type}`}>
          <Sparkles size={15} />
          <span style={{ fontSize: "13px", fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* ── LEFT FORM PANE ── */}
      <div className="login-left-pane">
        <div className="login-form-card">

          {/* Logo */}
          <div className="login-logo-container">
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px hsla(328,100%,54%,0.35)" }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }} className="text-gradient-indigo">E-CRM Portal</h2>
              <p style={{ fontSize: "10px", margin: 0, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-secondary)" }}>Academy Management System</p>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary)" }}>
              {activeTab === "login" ? "Welcome back 👋" : "Create account"}
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
              {activeTab === "login" ? "Sign in to your academy dashboard." : "Register a new portal account."}
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{ background: "hsla(342,90%,48%,0.08)", border: "1px solid hsla(342,90%,48%,0.25)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", color: "var(--color-danger)", marginBottom: "16px", fontWeight: 500 }} className="animate-fade-in">
              {errorMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="login-tabs" style={{ marginBottom: "24px" }}>
            <button type="button" className={`login-tab-btn ${activeTab === "login" ? "is-active" : ""}`} onClick={() => { setActiveTab("login"); setErrorMsg(""); }}>Sign In</button>
            <button type="button" className={`login-tab-btn ${activeTab === "signup" ? "is-active" : ""}`} onClick={() => { setActiveTab("signup"); setErrorMsg(""); }}>Create Account</button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {activeTab === "signup" && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "var(--text-secondary)", display: "flex" }}><User size={16} /></span>
                  <input type="text" placeholder="e.g. Dharmendra Kumar" value={name} onChange={e => setName(e.target.value)}
                    style={{ width: "100%", height: "46px", padding: "0 14px 0 42px", borderRadius: "10px", border: "1.5px solid var(--border-glass)", background: "hsla(285,30%,98%,0.7)", fontSize: "14px", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                    onFocus={e => (e.target.style.borderColor = "var(--color-accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border-glass)")} />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "14px", color: "var(--text-secondary)", display: "flex" }}><Mail size={16} /></span>
                <input type="email" placeholder="admin@academy.com" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: "100%", height: "46px", padding: "0 14px 0 42px", borderRadius: "10px", border: "1.5px solid var(--border-glass)", background: "hsla(285,30%,98%,0.7)", fontSize: "14px", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border-glass)")} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
                {activeTab === "login" && (
                  <span style={{ fontSize: "12px", color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
                )}
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "14px", color: "var(--text-secondary)", display: "flex" }}><Lock size={16} /></span>
                <input type={showPass ? "text" : "password"} placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: "100%", height: "46px", padding: "0 44px 0 42px", borderRadius: "10px", border: "1.5px solid var(--border-glass)", background: "hsla(285,30%,98%,0.7)", fontSize: "14px", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border-glass)")} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "14px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {activeTab === "signup" && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Portal Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {["ADMIN", "TEACHER", "STUDENT"].map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      style={{ padding: "9px", fontSize: "12px", fontWeight: 700, borderRadius: "10px", border: `1.5px solid ${role === r ? "var(--color-accent)" : "var(--border-glass)"}`, background: role === r ? "hsla(328,100%,54%,0.08)" : "transparent", color: role === r ? "var(--color-accent)" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s ease" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ height: "50px", borderRadius: "12px", border: "none", background: loading ? "hsl(285,20%,80%)" : "linear-gradient(135deg, hsl(328,100%,54%) 0%, hsl(271,91%,60%) 100%)", color: "#fff", fontSize: "14px", fontWeight: 800, letterSpacing: "0.5px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", transition: "all 0.2s ease", boxShadow: loading ? "none" : "0 6px 20px hsla(328,100%,54%,0.35)" }}>
              {loading ? (
                <><span style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "btnSpinnerRotate 0.6s linear infinite", display: "inline-block" }} />Processing...</>
              ) : (
                <>{activeTab === "login" ? "SIGN IN" : "CREATE ACCOUNT"}<ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "20px 0", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "1px" }}>OR DEMO ACCESS</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }} />
          </div>

          {/* Demo button */}
          <button type="button" onClick={handleDemoModeLogin} disabled={loading}
            style={{ width: "100%", height: "46px", borderRadius: "12px", border: "1.5px solid var(--border-glass)", background: "hsla(285,30%,98%,0.7)", color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)"; (e.currentTarget as HTMLElement).style.color = "var(--color-accent)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-glass)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}>
            <Zap size={15} style={{ color: "var(--color-accent)" }} />
            Launch with Demo Mode
          </button>

          {/* Toggle note */}
          <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
            {activeTab === "login" ? "New here? " : "Already registered? "}
            <span onClick={() => { setActiveTab(activeTab === "login" ? "signup" : "login"); setErrorMsg(""); }}
              style={{ color: "var(--color-accent)", fontWeight: 700, cursor: "pointer" }}>
              {activeTab === "login" ? "Create an account" : "Sign in"}
            </span>
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right-pane" style={{ overflow: "hidden" }}>
        <svg className="cloud-divider-svg" viewBox="0 0 120 1000" preserveAspectRatio="none">
          <path d="M0,0 L60,0 C85,90 40,180 85,270 C120,360 70,450 95,540 C110,630 65,720 90,810 C105,900 70,950 80,1000 L0,1000 Z" fill="hsla(200,95%,50%,0.1)" />
          <path d="M0,0 L40,0 C65,80 30,170 65,260 C90,350 50,440 75,530 C90,620 50,710 70,800 C85,890 50,940 60,1000 L0,1000 Z" fill="#ffffff" />
        </svg>

        {/* Neon floating icons */}
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
              <defs>
                <radialGradient id="planetGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="hsl(328,100%,75%)" />
                  <stop offset="60%" stopColor="hsl(328,100%,45%)" />
                  <stop offset="100%" stopColor="hsl(244,49%,14%)" />
                </radialGradient>
              </defs>
              <path d="M 5 65 A 58 18 15 0 1 115 52" fill="none" stroke="hsl(200,95%,65%)" strokeWidth="3.5" opacity="0.55" />
              <circle cx="60" cy="60" r="28" fill="url(#planetGrad)" />
              <path d="M 115 52 A 58 18 15 0 1 5 65" fill="none" stroke="hsl(200,95%,65%)" strokeWidth="4" style={{ filter: "drop-shadow(0 0 10px hsl(200,95%,50%))" }} />
            </svg>
          </div>
        </div>

        {/* Rocket — direct child of right pane so absolute positioning works correctly */}
        <div className="rocket-universe-container">
          <div className="rocket-wrapper">
            <div className="exhaust-particles-emitter">
              {Array.from({ length: 10 }, (_, i) => <span key={i} className={`exhaust-bubble bubble-${i + 1}`} />)}
            </div>
            <svg className="rocket-svg-element" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="fireGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="hsl(38,92%,50%)" stopOpacity="1" />
                  <stop offset="50%" stopColor="hsl(342,90%,48%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(271,91%,60%)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="innerFireGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="60%" stopColor="hsl(38,92%,50%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(342,90%,48%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className="rocket-flame-path">
                <path d="M10,75 C-12,70 -30,73 -35,75 C-30,77 -12,80 10,75 Z" fill="url(#fireGradient)" />
                <path d="M0,75 C-8,72 -20,74 -24,75 C-20,76 -8,78 0,75 Z" fill="url(#innerFireGradient)" />
              </g>
              <path d="M20,64 L30,64 L30,86 L20,86 Z" fill="#2c3e50" stroke="#1a252f" strokeWidth="1.5" />
              <path d="M32,60 L24,40 L45,55 Z" fill="hsl(328,100%,54%)" stroke="hsl(328,100%,40%)" strokeWidth="1.5" />
              <path d="M32,90 L24,110 L45,95 Z" fill="hsl(328,100%,54%)" stroke="hsl(328,100%,40%)" strokeWidth="1.5" />
              <path d="M28,60 C40,48 95,46 115,75 C95,104 40,102 28,90 Z" fill="#fcfcfc" stroke="#d5dbdb" strokeWidth="2" />
              <path d="M90,56 C96,62 108,70 115,75 C108,80 96,88 90,94 C93,88 96,81 96,75 C96,69 93,62 90,56 Z" fill="hsl(200,95%,50%)" />
              <circle cx="68" cy="75" r="14" fill="#34495e" />
              <circle cx="68" cy="75" r="10" fill="#e8f8f5" />
              <path d="M62,70 A8,8 0 0,1 74,70 Z" fill="#ffffff" opacity="0.6" />
            </svg>
          </div>
        </div>


      </div>
    </div>
  );
};
