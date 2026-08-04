import React from "react";
import {
  GraduationCap, Users2, BarChart3, Shield, Zap,
  CheckCircle2, ArrowRight, Star, Globe, IndianRupee,
} from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const features = [
    { icon: <Users2 size={24} />, title: "Student Management", desc: "Complete lifecycle from admission to alumni" },
    { icon: <GraduationCap size={24} />, title: "Academic Management", desc: "Courses, batches, timetables, homework" },
    { icon: <IndianRupee size={24} />, title: "Fee Management", desc: "Invoices, payments, reminders, reports" },
    { icon: <BarChart3 size={24} />, title: "Reports & Analytics", desc: "Real-time insights across all modules" },
    { icon: <Shield size={24} />, title: "Role-Based Access", desc: "Granular permissions for every role" },
    { icon: <Zap size={24} />, title: "Real-Time Attendance", desc: "Mark from mobile, sync instantly to web" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", position: "sticky", top: 0, background: "hsla(320,30%,98%,0.9)", backdropFilter: "blur(12px)", zIndex: 100, borderBottom: "1px solid var(--border-glass)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, fontFamily: "var(--font-headings)" }}>
            <span className="text-gradient-indigo">EduFlow</span> CRM
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="#features" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none" }}>Pricing</a>
          <button onClick={onLogin} style={{ padding: "8px 20px", borderRadius: "10px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px hsla(328,100%,54%,0.3)" }}>
            Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 40px 60px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "20px", background: "hsla(328,100%,54%,0.08)", border: "1px solid hsla(328,100%,54%,0.2)", marginBottom: "20px", fontSize: "12px", fontWeight: 700, color: "var(--color-accent)" }}>
          <Star size={12} /> Built for Indian Coaching Institutes & Schools
        </div>
        <h1 style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px", fontFamily: "var(--font-headings)" }}>
          The All-in-One <span className="text-gradient-indigo">Institution Management</span> Platform
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-secondary)", margin: "0 0 32px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          Admissions, Students, Fees, Attendance, Timetable, Homework, Exams, Library, Transport — all in one beautiful CRM.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={onLogin} style={{ padding: "14px 28px", borderRadius: "12px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff", border: "none", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 24px hsla(328,100%,54%,0.3)" }}>
            Start Free Trial <ArrowRight size={16} />
          </button>
          <button style={{ padding: "14px 28px", borderRadius: "12px", background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-glass)", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
            Book Demo
          </button>
        </div>

        {/* Trust badges */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "center", gap: "24px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
          {["500+ Institutes", "50,000+ Students", "99.9% Uptime", "24/7 Support"].map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: "6px" }}><CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />{t}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "60px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "32px", fontWeight: 800, margin: "0 0 8px", fontFamily: "var(--font-headings)" }}>
          Everything You Need
        </h2>
        <p style={{ textAlign: "center", fontSize: "15px", color: "var(--text-secondary)", margin: "0 0 40px" }}>
          20+ modules designed specifically for educational institutions.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)", transition: "all 0.25s", cursor: "default" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(29,10,39,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "hsla(328,100%,54%,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent)", marginBottom: "16px" }}>
                {f.icon}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700 }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "60px 40px", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "32px", fontWeight: 800, margin: "0 0 40px", fontFamily: "var(--font-headings)" }}>
          Simple, Transparent Pricing
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {[
            { name: "Starter", price: "Free", desc: "Up to 50 students", features: ["Students & Batches", "Attendance", "Basic Reports", "1 Admin"] },
            { name: "Pro", price: "₹2,999/mo", desc: "Up to 500 students", features: ["Everything in Starter", "Fees & Invoices", "Homework", "Library", "5 Staff", "WhatsApp"] },
            { name: "Enterprise", price: "Custom", desc: "Unlimited", features: ["Everything in Pro", "Multi-campus", "Custom Roles", "API Access", "Priority Support", "White-label"] },
          ].map((plan, i) => (
            <div key={i} style={{ background: i === 1 ? "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))" : "#fff", borderRadius: "20px", padding: "28px", border: i === 1 ? "none" : "1px solid var(--border-glass)", color: i === 1 ? "#fff" : "var(--text-primary)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, opacity: 0.8 }}>{plan.name}</p>
              <h3 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 800 }}>{plan.price}</h3>
              <p style={{ margin: "0 0 16px", fontSize: "12px", opacity: 0.7 }}>{plan.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {plan.features.map((f) => (
                  <span key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600 }}>
                    <CheckCircle2 size={14} style={{ opacity: 0.8 }} /> {f}
                  </span>
                ))}
              </div>
              <button onClick={onLogin} style={{ width: "100%", marginTop: "20px", padding: "10px", borderRadius: "10px", border: i === 1 ? "1px solid hsla(0,0%,100%,0.3)" : "1px solid var(--border-glass)", background: i === 1 ? "hsla(0,0%,100%,0.15)" : "transparent", color: i === 1 ? "#fff" : "var(--color-accent)", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 40px", borderTop: "1px solid var(--border-glass)", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
          EduFlow CRM · Built for Indian Education · &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
