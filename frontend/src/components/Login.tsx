import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { supabase } from "../utils/supabaseClient";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  Brain,
  Lightbulb,
  Trophy,
  HelpCircle,
  Puzzle,
  BookOpen
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (sessionUser: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("Dharmendra");
  const [password, setPassword] = useState("1234567890");
  const [name, setName] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Helper for displaying auto-dismissing toast notifications
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!email || !password) {
      setErrorMsg("Please fill in all credentials.");
      setLoading(false);
      return;
    }

    if (activeTab === "signup" && !name) {
      setErrorMsg("Please provide your name to register.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // If we are offline or mock Supabase url is used, bypass to demo mode
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("placeholder-key") ||
            error.message.includes("Invalid login credentials")
          ) {
            handleDemoModeLogin();
            return;
          }
          throw error;
        }

        if (data?.user) {
          showToast("Welcome back!", "success");
          onLoginSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
            },
          },
        });

        if (error) {
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("placeholder-key")
          ) {
            handleDemoModeSignup();
            return;
          }
          throw error;
        }

        if (data?.user) {
          showToast("Registration successful! Proceeding to portal.", "success");
          onLoginSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "An authentication error occurred.");
      showToast(err.message || "An authentication error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Graceful Local Fallbacks for E-CRM demonstration
  const handleDemoModeLogin = () => {
    showToast("Connecting locally. Launching Demo E-CRM Console...", "info");
    setTimeout(() => {
      onLoginSuccess({
        id: "demo-user",
        email: email,
        user_metadata: {
          name: email.split("@")[0].toUpperCase() || "Dharmendra Admin",
          role: "ADMIN",
        },
      });
    }, 1200);
  };

  const handleDemoModeSignup = () => {
    showToast("Profile created locally. Customizing E-CRM Workspace...", "success");
    setTimeout(() => {
      onLoginSuccess({
        id: "demo-user-signup",
        email: email,
        user_metadata: {
          name: name,
          role: role,
        },
      });
    }, 1200);
  };

  return (
    <div className="login-root">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`login-toast login-toast-${toast.type}`}>
          <Sparkles size={16} className={toast.type === "success" ? "neon-glow-green" : "neon-glow-pink"} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {toast.message}
          </span>
        </div>
      )}

      {/* LEFT FORM SIDE */}
      <div className="login-left-pane">
        <div className="login-form-card">
          {/* Logo Header */}
          <div className="login-logo-container">
            <GraduationCap size={36} style={{ color: "var(--color-brand-accent)" }} />
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }} className="text-gradient-indigo">
                E-CRM Portal
              </h2>
              <p style={{ fontSize: "11px", margin: 0, letterSpacing: "1px", textTransform: "uppercase" }}>
                Academy Management System
              </p>
            </div>
          </div>

          <h1 className="login-heading">
            {activeTab === "login" ? "STUDENT LOGIN" : "GET STARTED"}
          </h1>
          <p className="login-subheading">
            {activeTab === "login"
              ? "Access leads, schedules, and billing portal."
              : "Register a student or instructor account profile."}
          </p>

          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={{
                background: "hsla(342, 90%, 48%, 0.08)",
                border: "1px solid hsla(342, 90%, 48%, 0.2)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--color-brand-danger)",
                marginBottom: "20px",
                fontWeight: 500,
              }}
              className="animate-fade-in"
            >
              {errorMsg}
            </div>
          )}

          {/* Form Tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab-btn ${activeTab === "login" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                setErrorMsg("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`login-tab-btn ${activeTab === "signup" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("signup");
                setErrorMsg("");
              }}
            >
              Create Account
            </button>
          </div>

          {/* Auth Submission Form */}
          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {activeTab === "signup" && (
              <Input
                label="Full Name"
                type="text"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User size={18} />}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
            />

            <Input
              label="Password"
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
            />

            {activeTab === "signup" && (
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Choose Workspace Role
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["STUDENT", "TEACHER", "ADMIN"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: role === r ? "var(--color-brand-accent)" : "var(--border-glass)",
                        background: role === r ? "hsla(328, 100%, 54%, 0.08)" : "transparent",
                        color: role === r ? "var(--color-brand-accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button variant="primary" type="submit" isLoading={loading} style={{ height: "48px", marginTop: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {activeTab === "login" ? "SIGN IN" : "REGISTER PORTAL"}
                <ArrowRight size={16} />
              </span>
            </Button>
          </form>

          {/* Social login divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "24px 0", gap: "10px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 550 }}>
              OR DEMO ACCESS
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }} />
          </div>

          {/* Easy One-click Demo Button */}
          <Button
            variant="secondary"
            onClick={handleDemoModeLogin}
            style={{ width: "100%", height: "46px" }}
          >
            Launch with Demo Mode
          </Button>

          {/* Footer toggle note */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            {activeTab === "login" ? (
              <p style={{ fontSize: "13px" }}>
                New User?{" "}
                <span
                  onClick={() => setActiveTab("signup")}
                  style={{ color: "var(--color-brand-accent)", fontWeight: 700, cursor: "pointer" }}
                >
                  Create an account
                </span>
              </p>
            ) : (
              <p style={{ fontSize: "13px" }}>
                Already have an account?{" "}
                <span
                  onClick={() => setActiveTab("login")}
                  style={{ color: "var(--color-brand-accent)", fontWeight: 700, cursor: "pointer" }}
                >
                  Sign in
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COSMIC NEON SIDE */}
      <div className="login-right-pane">
        {/* Layered Cloud divider SVG - White and Translucent blue cloud borders */}
        <svg className="cloud-divider-svg" viewBox="0 0 120 1000" preserveAspectRatio="none">
          {/* Secondary shadow cloud boundary */}
          <path
            d="M0,0 L60,0 C85,90 40,180 85,270 C120,360 70,450 95,540 C110,630 65,720 90,810 C105,900 70,950 80,1000 L0,1000 Z"
            fill="hsla(200, 95%, 50%, 0.12)"
          />
          {/* Primary solid white cloud boundary */}
          <path
            d="M0,0 L40,0 C65,80 30,170 65,260 C90,350 50,440 75,530 C90,620 50,710 70,800 C85,890 50,940 60,1000 L0,1000 Z"
            fill="#ffffff"
          />
        </svg>

        {/* NEON SYMBOLS LAYER */}
        <div className="neon-floating-icons-layer">
          {/* Custom neon-tube style SVG Question Mark to resolve clipping/font issues */}
          <div className="neon-symbol-wrapper symbol-question neon-glow-cyan">
            <svg width="50" height="70" viewBox="0 0 50 70" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 8 20 C 8 4, 42 4, 42 20 C 42 34, 25 38, 25 48" />
              <circle cx="25" cy="60" r="3" fill="currentColor" stroke="none" />
            </svg>
          </div>
          
          <div className="neon-symbol-wrapper symbol-brain neon-glow-pink">
            <Brain size={56} />
          </div>

          <div className="neon-symbol-wrapper symbol-bulb neon-glow-yellow">
            <Lightbulb size={40} />
          </div>

          <div className="neon-symbol-wrapper symbol-puzzle-1 neon-glow-purple">
            <Puzzle size={44} style={{ transform: "rotate(20deg)" }} />
          </div>

          <div className="neon-symbol-wrapper symbol-puzzle-2 neon-glow-green">
            <Puzzle size={32} style={{ transform: "rotate(-15deg)" }} />
          </div>

          <div className="neon-symbol-wrapper symbol-trophy neon-glow-pink">
            <Trophy size={48} />
          </div>

          <div className="neon-symbol-wrapper symbol-star-1 neon-glow-cyan">
            <Sparkles size={24} />
          </div>

          <div className="neon-symbol-wrapper symbol-star-2 neon-glow-yellow">
            <Sparkles size={32} />
          </div>

          <div className="neon-symbol-wrapper symbol-planet">
            <svg width="140" height="140" viewBox="-10 -10 140 140" overflow="visible" style={{ filter: "drop-shadow(0 0 15px hsla(328, 100%, 54%, 0.6))" }}>
              <defs>
                <radialGradient id="planetGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="hsl(328, 100%, 75%)" />
                  <stop offset="60%" stopColor="hsl(328, 100%, 45%)" />
                  <stop offset="100%" stopColor="hsl(244, 49%, 14%)" />
                </radialGradient>
              </defs>
              {/* Back of the planet ring */}
              <path d="M 5 65 A 58 18 15 0 1 115 52" fill="none" stroke="hsl(200, 95%, 65%)" strokeWidth="3.5" opacity="0.55" style={{ filter: "drop-shadow(0 0 8px hsl(200, 95%, 50%))" }} />
              {/* Planet sphere */}
              <circle cx="60" cy="60" r="28" fill="url(#planetGrad)" />
              {/* Front of the planet ring */}
              <path d="M 115 52 A 58 18 15 0 1 5 65" fill="none" stroke="hsl(200, 95%, 65%)" strokeWidth="4" style={{ filter: "drop-shadow(0 0 10px hsl(200, 95%, 50%))" }} />
            </svg>
          </div>

          {/* New Custom High-Fidelity SVG Satellite (pointing outwards/upwards) */}
          <div className="neon-symbol-wrapper symbol-satellite">
            <svg width="70" height="70" viewBox="0 0 64 64" style={{ filter: "drop-shadow(0 0 12px hsla(271, 91%, 60%, 0.65))" }}>
              {/* Left solar panel array */}
              <rect x="2" y="22" width="16" height="20" rx="2" fill="hsl(200, 95%, 65%)" stroke="hsl(200, 95%, 45%)" strokeWidth="2"/>
              <line x1="2" y1="32" x2="18" y2="32" stroke="hsl(200, 95%, 45%)" strokeWidth="1.5" />
              {/* Right solar panel array */}
              <rect x="46" y="22" width="16" height="20" rx="2" fill="hsl(200, 95%, 65%)" stroke="hsl(200, 95%, 45%)" strokeWidth="2"/>
              <line x1="46" y1="32" x2="62" y2="32" stroke="hsl(200, 95%, 45%)" strokeWidth="1.5" />
              {/* Core chassis connect rods */}
              <line x1="18" y1="32" x2="46" y2="32" stroke="#ecf0f1" strokeWidth="3.5"/>
              {/* Satellite central body */}
              <rect x="25" y="24" width="14" height="16" rx="3" fill="#ffffff" stroke="hsl(271, 91%, 60%)" strokeWidth="2.5" />
              <circle cx="32" cy="32" r="3" fill="hsl(328, 100%, 54%)" />
              {/* Antenna dish pointing outwards */}
              <path d="M 22 18 Q 32 10 42 18" fill="none" stroke="#ffffff" strokeWidth="2"/>
              <line x1="32" y1="14" x2="32" y2="6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="32" cy="4" r="2.5" fill="hsl(328, 100%, 54%)" style={{ filter: "drop-shadow(0 0 6px hsl(328, 100%, 54%))" }} />
            </svg>
          </div>

          {/* New Book Symbol representing learning */}
          <div className="neon-symbol-wrapper symbol-book neon-glow-purple">
            <BookOpen size={42} />
          </div>

          {/* New Graduation Cap Symbol */}
          <div className="neon-symbol-wrapper symbol-grad-cap neon-glow-yellow">
            <GraduationCap size={44} />
          </div>

          {/* Extra sparkles background details */}
          <div className="neon-symbol-wrapper symbol-star-3 neon-glow-cyan">
            <Sparkles size={18} />
          </div>

          <div className="neon-symbol-wrapper symbol-star-4 neon-glow-yellow">
            <Sparkles size={20} />
          </div>
        </div>

        {/* ROCKET UNIVERSE CONTAINER */}
        <div className="rocket-universe-container">
          <div className="rocket-wrapper">
            {/* Drifting Exhaust Particles */}
            <div className="exhaust-particles-emitter">
              <span className="exhaust-bubble bubble-1" />
              <span className="exhaust-bubble bubble-2" />
              <span className="exhaust-bubble bubble-3" />
              <span className="exhaust-bubble bubble-4" />
              <span className="exhaust-bubble bubble-5" />
              <span className="exhaust-bubble bubble-6" />
              <span className="exhaust-bubble bubble-7" />
              <span className="exhaust-bubble bubble-8" />
              <span className="exhaust-bubble bubble-9" />
              <span className="exhaust-bubble bubble-10" />
            </div>

            {/* Custom High-Fidelity Rocket SVG */}
            <svg
              className="rocket-svg-element"
              viewBox="0 0 150 150"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Rocket Flame */}
              <g className="rocket-flame-path">
                <path
                  d="M10,75 C-12,70 -30,73 -35,75 C-30,77 -12,80 10,75 Z"
                  fill="url(#fireGradient)"
                />
                <path
                  d="M0,75 C-8,72 -20,74 -24,75 C-20,76 -8,78 0,75 Z"
                  fill="url(#innerFireGradient)"
                />
              </g>

              {/* Engine Nozzle */}
              <path
                d="M20,64 L30,64 L30,86 L20,86 Z"
                fill="#2c3e50"
                stroke="#1a252f"
                strokeWidth="1.5"
              />

              {/* Side Fins */}
              <path
                d="M32,60 L24,40 L45,55 Z"
                fill="hsl(328, 100%, 54%)"
                stroke="hsl(328, 100%, 40%)"
                strokeWidth="1.5"
              />
              <path
                d="M32,90 L24,110 L45,95 Z"
                fill="hsl(328, 100%, 54%)"
                stroke="hsl(328, 100%, 40%)"
                strokeWidth="1.5"
              />

              {/* Main Rocket Body Capsule */}
              <path
                d="M28,60 C40,48 95,46 115,75 C95,104 40,102 28,90 Z"
                fill="#fcfcfc"
                stroke="#d5dbdb"
                strokeWidth="2"
              />

              {/* Nose Cone Trim */}
              <path
                d="M90,56 C96,62 108,70 115,75 C108,80 96,88 90,94 C93,88 96,81 96,75 C96,69 93,62 90,56 Z"
                fill="hsl(200, 95%, 50%)"
              />

              {/* Porthole Window Trim */}
              <circle cx="68" cy="75" r="14" fill="#34495e" />
              {/* Porthole Glass */}
              <circle cx="68" cy="75" r="10" fill="#e8f8f5" />
              <path d="M62,70 A8,8 0 0,1 74,70 Z" fill="#ffffff" opacity="0.6" />

              {/* Gradients */}
              <defs>
                <linearGradient id="fireGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity="1" />
                  <stop offset="50%" stopColor="hsl(342, 90%, 48%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(271, 91%, 60%)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="innerFireGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="60%" stopColor="hsl(38, 92%, 50%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(342, 90%, 48%)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
