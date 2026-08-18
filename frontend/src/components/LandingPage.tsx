import React, { useState } from "react";
import {
  GraduationCap, Users2, BarChart3, Shield, Zap,
  CheckCircle2, ArrowRight, Star, Globe, IndianRupee,
  Mail, Phone, MapPin, Download, Send, Sparkles,
  BookOpen, Calendar, Award, MessageSquare, Clock, Building2,
  FileSpreadsheet, HelpCircle, ChevronRight, Check
} from "lucide-react";
import * as XLSX from "xlsx";

interface LandingPageProps {
  onLogin: () => void;
}

interface Inquiry {
  srNo: number;
  name: string;
  gmail: string;
  contact: string;
  personalInfo: string;
  date: string;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  // Page view state: "all" or specific page tab ("home" | "about" | "modules" | "pricing" | "inquiry")
  const [activePage, setActivePage] = useState<"all" | "home" | "about" | "modules" | "pricing" | "inquiry">("all");

  // Inquiry form state - starting clean without dummy lead data
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    gmail: "",
    contact: "",
    personalInfo: "",
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.gmail || !formData.contact) {
      alert("Please fill in Name, Gmail/Email, and Contact Number.");
      return;
    }

    const newInquiry: Inquiry = {
      srNo: inquiries.length + 1,
      name: formData.name,
      gmail: formData.gmail,
      contact: formData.contact,
      personalInfo: formData.personalInfo || "N/A",
      date: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
    };

    setInquiries((prev) => [...prev, newInquiry]);
    setFormData({ name: "", gmail: "", contact: "", personalInfo: "" });
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 5000);
  };

  const handleExportExcel = () => {
    if (inquiries.length === 0) {
      alert("No inquiries recorded yet. Please submit an inquiry first to download.");
      return;
    }

    const excelData = inquiries.map((item) => ({
      "Sr. No": item.srNo,
      "Name": item.name,
      "Contact": item.contact,
      "Gmail": item.gmail,
      "Personal Info": item.personalInfo,
      "Date & Time": item.date,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 8 },  // Sr. No
      { wch: 22 }, // Name
      { wch: 18 }, // Contact
      { wch: 28 }, // Gmail
      { wch: 45 }, // Personal Info
      { wch: 22 }, // Date & Time
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ECRM Inquiries");

    XLSX.writeFile(workbook, `ECRM_Inquiries_Leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const features = [
    { icon: <Users2 size={24} />, title: "Student Management", desc: "Complete lifecycle tracking from inquiry, admission to alumni network." },
    { icon: <GraduationCap size={24} />, title: "Academic Management", desc: "Interactive class timetable, batch allocations, syllabus & homework tracking." },
    { icon: <IndianRupee size={24} />, title: "Fee & Invoicing Engine", desc: "Automated fee receipts, installment plans, pending reminders, and GST reports." },
    { icon: <BarChart3 size={24} />, title: "Reports & Analytics", desc: "Real-time visual insights into student attendance, revenue, and academic progress." },
    { icon: <Shield size={24} />, title: "Role-Based Security", desc: "Granular access permissions for Admins, Teachers, Accountants, and Parents." },
    { icon: <Zap size={24} />, title: "Smart Attendance Sync", desc: "Mark attendance via mobile app with instant SMS/WhatsApp alerts to parents." },
    { icon: <Award size={24} />, title: "Exams & Marksheet", desc: "Generate report cards, marksheets, rank lists, and weak student identification." },
    { icon: <MessageSquare size={24} />, title: "Communication Hub", desc: "Broadcast announcements, email newsletters, and direct parent notifications." },
  ];

  const modules = [
    { name: "Admissions CRM", tag: "Lead Tracking", desc: "Capture prospective leads, manage follow-ups, and convert inquiries into enrollments seamlessly." },
    { name: "Online Fees & Billing", tag: "Auto Invoicing", desc: "Accept online fee payments, send automated WhatsApp receipts, and track collection history." },
    { name: "Exam & Marksheet Portal", tag: "Auto Grading", desc: "Create term exams, enter subject marks, auto-calculate grades & print professional report cards." },
    { name: "Attendance & SMS Sync", tag: "Live Alerts", desc: "Track daily student & staff attendance with instant mobile alerts to parents for absent students." },
    { name: "Transport & Library", tag: "Asset Care", desc: "Manage bus routes, driver details, library book issuance, and penalty tracking effortlessly." },
    { name: "Weak Student AI Tracker", tag: "Analytics", desc: "Automatically identify struggling students based on exam trends and trigger extra remedial classes." },
  ];

  const navItems = [
    { id: "all", label: "Full Website View" },
    { id: "home", label: "Home" },
    { id: "about", label: "About ECRM" },
    { id: "modules", label: "Modules" },
    { id: "pricing", label: "Pricing" },
    { id: "inquiry", label: "Inquiry & Demo" },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden", color: "#1e1b4b", fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      {/* Blurred Wallpaper Background Overlay */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "url('/landing-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(6px) brightness(0.96) saturate(1.1)",
        transform: "scale(1.04)",
        zIndex: 0
      }} />

      {/* Subtle Tint Gradient Layer over background */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(135deg, rgba(255,255,255,0.70) 0%, rgba(248,245,255,0.65) 100%)",
        zIndex: 1
      }} />

      {/* Main Content Container */}
      <div style={{ position: "relative", zIndex: 2 }}>
        
        {/* FIXED Header Navigation Bar with sleek height */}
        <nav style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 40px", position: "fixed", top: 0, left: 0, right: 0,
          width: "100%", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid hsla(285,40%,60%,0.12)", zIndex: 1000,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          transition: "all 0.3s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => { setActivePage("all"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px hsla(328,100%,54%,0.35)"
            }}>
              <GraduationCap size={20} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                <span className="text-gradient-indigo">EduFlow</span> <span style={{ color: "#1e1b4b" }}>ECRM</span>
              </span>
              <span style={{ display: "block", fontSize: "9px", fontWeight: 800, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Institution OS
              </span>
            </div>
          </div>

          {/* Text-Only Navigations */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            {[
              { id: "all", label: "Overview" },
              { id: "about", label: "About ECRM" },
              { id: "modules", label: "Modules" },
              { id: "pricing", label: "Pricing" },
              { id: "inquiry", label: "Contact & Inquiry" },
            ].map((item) => {
              const isActive = activePage === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id === "all" ? "home" : item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActivePage(item.id as any);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    fontSize: "14.5px", fontWeight: isActive ? 900 : 700,
                    color: isActive ? "var(--color-accent)" : "#1e1b4b",
                    textDecoration: "none", letterSpacing: "0.2px",
                    padding: "2px 0",
                    borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <button onClick={onLogin} style={{
            padding: "8px 22px", borderRadius: "10px",
            background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
            color: "#fff", border: "none", fontSize: "13.5px", fontWeight: 800,
            cursor: "pointer", boxShadow: "0 4px 16px hsla(328,100%,54%,0.4)", letterSpacing: "0.3px",
            transition: "transform 0.2s"
          }}>
            Login to ECRM
          </button>
        </nav>

        {/* Content Wrapper with Centered Layout for Single View Pages */}
        <div style={{
          paddingTop: "76px",
          minHeight: activePage === "all" ? "auto" : "calc(100vh - 76px)",
          display: activePage === "all" ? "block" : "flex",
          flexDirection: "column",
          justifyContent: activePage === "all" ? "flex-start" : "center",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box"
        }}>

          {/* Hero Section (Visible in 'all' or 'home') */}
          {(activePage === "all" || activePage === "home") && (
            <section id="home" style={{ padding: "40px 24px 30px", textAlign: "center", maxWidth: "900px", width: "100%", margin: "0 auto" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 14px",
                borderRadius: "20px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
                border: "1px solid hsla(328,100%,54%,0.3)", marginBottom: "16px", fontSize: "12px",
                fontWeight: 800, color: "var(--color-accent)", boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
              }}>
                <Sparkles size={13} /> Complete Enterprise Education Management Software
              </div>
              <h1 style={{ fontSize: "38px", fontWeight: 900, lineHeight: 1.2, margin: "0 0 14px", letterSpacing: "-0.5px" }}>
                Transform Your Educational Institution with <span className="text-gradient-indigo">Smart E-CRM</span>
              </h1>
              <p style={{ fontSize: "15px", color: "#475569", margin: "0 0 24px", maxWidth: "700px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.5, fontWeight: 500 }}>
                Manage Student Admissions, Fees & Automated Receipts, Attendance, Exams, Marksheet Generation, Staff Payroll, Timetable & Parent Communication in one seamless, high-performance platform.
              </p>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={onLogin} style={{
                  padding: "12px 26px", borderRadius: "10px",
                  background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
                  color: "#fff", border: "none", fontSize: "14.5px", fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                  boxShadow: "0 6px 20px hsla(328,100%,54%,0.35)"
                }}>
                  Try Free Demo <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setActivePage("inquiry");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    padding: "12px 26px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
                    color: "#1e1b4b", border: "1px solid hsla(285,40%,60%,0.3)",
                    fontSize: "14.5px", fontWeight: 800, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(0,0,0,0.05)"
                  }}
                >
                  <FileSpreadsheet size={16} color="var(--color-accent)" /> Book Custom Demo
                </button>
              </div>
            </section>
          )}

        {/* Section: Comprehensive About ECRM */}
        {(activePage === "all" || activePage === "about") && (
          <section id="about" style={{ padding: activePage === "about" ? "20px 24px 40px" : "40px 24px", maxWidth: "1100px", width: "100%", boxSizing: "border-box", margin: "0 auto", scrollMarginTop: "90px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--color-accent)" }}>
                Why E-CRM?
              </span>
              <h2 style={{ fontSize: "28px", fontWeight: 900, margin: "6px 0 8px" }}>
                Built Specifically for Indian Schools & Coaching Institutes
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "600px", margin: "0 auto" }}>
                Eliminate manual paperwork, track fees in real time, auto-generate report cards, and provide parents with instant attendance updates.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  background: "rgba(255, 255, 255, 0.88)", backdropFilter: "blur(16px)",
                  borderRadius: "16px", padding: "20px 18px", border: "1px solid hsla(285,40%,60%,0.18)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)", transition: "all 0.25s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "hsla(328,100%,54%,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "hsla(285,40%,60%,0.18)"; }}>
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "12px",
                    background: "hsla(328,100%,54%,0.12)", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "var(--color-accent)", marginBottom: "14px"
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800 }}>{f.title}</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Modules & Features Grid */}
        {(activePage === "all" || activePage === "modules") && (
          <section id="modules" style={{ padding: activePage === "modules" ? "20px 24px 40px" : "40px 24px", maxWidth: "1100px", width: "100%", boxSizing: "border-box", margin: "0 auto", background: "rgba(255,255,255,0.4)", borderRadius: "24px", backdropFilter: "blur(10px)", scrollMarginTop: "90px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "hsl(271,91%,60%)" }}>
                Powerful Suite
              </span>
              <h2 style={{ fontSize: "28px", fontWeight: 900, margin: "6px 0 8px" }}>
                Explore E-CRM Core Modules
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "600px", margin: "0 auto" }}>
                Every single tool designed to run your academic and administrative operations with precision.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              {modules.map((m, idx) => (
                <div key={idx} style={{
                  background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(16px)",
                  borderRadius: "16px", padding: "20px", border: "1px solid hsla(285,40%,60%,0.18)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
                }}>
                  <span style={{
                    fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "10px",
                    background: "hsla(271,91%,60%,0.12)", color: "hsl(271,91%,60%)", textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {m.tag}
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "10px 0 6px" }}>{m.name}</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Updated Pricing */}
        {(activePage === "all" || activePage === "pricing") && (
          <section id="pricing" style={{ padding: activePage === "pricing" ? "20px 24px 40px" : "40px 24px", maxWidth: "1100px", width: "100%", boxSizing: "border-box", margin: "0 auto", scrollMarginTop: "90px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--color-accent)" }}>
                Plans & Pricing
              </span>
              <h2 style={{ fontSize: "28px", fontWeight: 900, margin: "6px 0 8px" }}>
                Transparent Pricing for Every Scale
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "560px", margin: "0 auto" }}>
                Start with a free testing demo, upgrade to our standard flat monthly plan, or request custom features for large campuses.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "stretch" }}>
              {/* Plan 1: Free Testing Demo */}
              <div style={{
                background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(16px)",
                borderRadius: "20px", padding: "26px 22px", border: "1px solid hsla(285,40%,60%,0.22)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b" }}>
                    Plan 1 · Starter
                  </span>
                  <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "4px 0 2px" }}>Testing Demo</h3>
                  <div style={{ fontSize: "30px", fontWeight: 900, color: "#1e1b4b", margin: "8px 0 4px" }}>
                    Free <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>/ forever trial</span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "18px" }}>
                    Perfect for exploring ECRM features with full testing access and sample data.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    {[
                      "Full Access to Testing Demo",
                      "Sample Student & Fee Records",
                      "Attendance & Timetable Trial",
                      "Up to 50 Student Records",
                      "Community Support"
                    ].map((feat, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
                        <Check size={15} color="var(--color-success)" /> {feat}
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={onLogin} style={{
                  width: "100%", padding: "11px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.9)", color: "var(--color-accent)",
                  border: "2px solid hsla(328,100%,54%,0.4)", fontSize: "14px", fontWeight: 800,
                  cursor: "pointer", transition: "all 0.2s"
                }}>
                  Start Free Testing Demo
                </button>
              </div>

              {/* Plan 2: ₹10,000 / month (Popular) */}
              <div style={{
                background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
                color: "#fff", borderRadius: "20px", padding: "26px 22px",
                boxShadow: "0 12px 32px hsla(328,100%,54%,0.35)", display: "flex", flexDirection: "column",
                justifyContent: "space-between", position: "relative", transform: "scale(1.02)", zIndex: 10
              }}>
                <div style={{
                  position: "absolute", top: "-12px", right: "20px", background: "#fff", color: "var(--color-accent)",
                  fontSize: "10px", fontWeight: 900, padding: "3px 12px", borderRadius: "16px", textTransform: "uppercase",
                  letterSpacing: "1px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  Most Popular
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9 }}>
                    Plan 2 · Full Growth
                  </span>
                  <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "4px 0 2px" }}>Standard Plan</h3>
                  <div style={{ fontSize: "32px", fontWeight: 900, margin: "8px 0 4px" }}>
                    ₹10,000 <span style={{ fontSize: "13px", fontWeight: 600, opacity: 0.9 }}>/ month</span>
                  </div>
                  <p style={{ fontSize: "12.5px", opacity: 0.9, marginBottom: "18px" }}>
                    All-in-one suite for growing institutes, coaching centers, and schools.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    {[
                      "Everything in Testing Demo",
                      "Unlimited Students & Batches",
                      "Automated Fee Receipts & Reminders",
                      "WhatsApp & Email Integration",
                      "Exam Marksheet Generator",
                      "Parent & Staff Mobile Portals",
                      "24/7 Priority Phone Support"
                    ].map((feat, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700 }}>
                        <CheckCircle2 size={15} color="#fff" /> {feat}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActivePage("inquiry");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    display: "block", textAlign: "center", textDecoration: "none",
                    width: "100%", padding: "11px", borderRadius: "10px",
                    background: "#fff", color: "var(--color-accent)", border: "none",
                    fontSize: "14px", fontWeight: 900, cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)"
                  }}
                >
                  Get Started Plan ₹10,000/mo
                </button>
              </div>

              {/* Plan 3: Custom Features / Custom Amount */}
              <div style={{
                background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(16px)",
                borderRadius: "20px", padding: "26px 22px", border: "1px solid hsla(285,40%,60%,0.22)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b" }}>
                    Plan 3 · Enterprise
                  </span>
                  <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "4px 0 2px" }}>Custom Plan</h3>
                  <div style={{ fontSize: "30px", fontWeight: 900, color: "#1e1b4b", margin: "8px 0 4px" }}>
                    Custom Amount
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "18px" }}>
                    Tailored solutions with custom features for multi-branch institutions & universities.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    {[
                      "Everything in Standard Plan",
                      "Custom Module Development",
                      "Multi-Branch & Chain Management",
                      "Custom API & Payment Gateway Integrations",
                      "White-Labeling & Custom Domain",
                      "Dedicated Account Manager & Training"
                    ].map((feat, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
                        <Check size={15} color="hsl(271,91%,60%)" /> {feat}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActivePage("inquiry");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    display: "block", textAlign: "center", textDecoration: "none",
                    width: "100%", padding: "11px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #1e1b4b, #312e81)", color: "#fff", border: "none",
                    fontSize: "14px", fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
                  }}
                >
                  Contact for Custom Pricing
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Section: Contact & Inquiry Form with Excel Sheet Export */}
        {(activePage === "all" || activePage === "inquiry") && (
          <section id="inquiry" style={{ padding: activePage === "inquiry" ? "16px 24px 30px" : "40px 24px", maxWidth: "1100px", width: "100%", boxSizing: "border-box", margin: "0 auto", scrollMarginTop: "90px" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.94)", backdropFilter: "blur(20px)",
            borderRadius: "24px", padding: "24px 28px", border: "1px solid hsla(285,40%,60%,0.22)",
            boxShadow: "0 10px 32px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              
              {/* Left Column: Form */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-accent)" }}>
                  Connect With Us
                </span>
                <h2 style={{ fontSize: "24px", fontWeight: 900, margin: "4px 0 6px" }}>
                  Request Demo & Inquire Details
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
                  Fill in your personal and institution details below. All submitted inquiries are logged in real time and can be exported directly into a formatted Excel sheet.
                </p>

                {submittedSuccess && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "10px", background: "hsla(142,70%,45%,0.15)",
                    border: "1px solid var(--color-success)", color: "var(--color-success)",
                    fontSize: "13px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px"
                  }}>
                    <CheckCircle2 size={16} /> Inquiry submitted successfully! Excel sheet updated.
                  </div>
                )}

                <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Dharmendra Sharma"
                      required
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: "8px",
                        border: "1px solid #cbd5e1", fontSize: "13px", outline: "none",
                        background: "rgba(255,255,255,0.85)"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                        Gmail / Email *
                      </label>
                      <input
                        type="email"
                        name="gmail"
                        value={formData.gmail}
                        onChange={handleInputChange}
                        placeholder="your.email@gmail.com"
                        required
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: "8px",
                          border: "1px solid #cbd5e1", fontSize: "13px", outline: "none",
                          background: "rgba(255,255,255,0.85)"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        required
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: "8px",
                          border: "1px solid #cbd5e1", fontSize: "13px", outline: "none",
                          background: "rgba(255,255,255,0.85)"
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Personal Info & Institution Message
                    </label>
                    <textarea
                      name="personalInfo"
                      value={formData.personalInfo}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="e.g. Director at Excel Classes. Need info on ₹10,000/mo plan & WhatsApp module..."
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: "8px",
                        border: "1px solid #cbd5e1", fontSize: "13px", outline: "none",
                        background: "rgba(255,255,255,0.85)", resize: "vertical"
                      }}
                    />
                  </div>

                  <button type="submit" style={{
                    padding: "10px 20px", borderRadius: "10px",
                    background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
                    color: "#fff", border: "none", fontSize: "14px", fontWeight: 800,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "8px", boxShadow: "0 4px 16px hsla(328,100%,54%,0.35)", marginTop: "4px"
                  }}>
                    <Send size={15} /> Submit Inquiry
                  </button>
                </form>
              </div>

              {/* Right Column: Excel Sheet Lead Store & Download */}
              <div style={{
                background: "rgba(248, 250, 252, 0.95)", borderRadius: "18px",
                padding: "20px", border: "1px solid #e2e8f0", display: "flex",
                flexDirection: "column", justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileSpreadsheet size={20} color="var(--color-success)" />
                      <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>
                        Live Lead Registry Excel Sheet
                      </h3>
                    </div>
                    <span style={{
                      fontSize: "10px", fontWeight: 800, padding: "3px 8px",
                      borderRadius: "8px", background: "hsla(142,70%,45%,0.15)", color: "var(--color-success)"
                    }}>
                      {inquiries.length} Inquiries Stored
                    </span>
                  </div>

                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>
                    All details entered in the inquiry form are captured with Sr. No, Name, Contact, Gmail, and Personal Info. Download the full Excel sheet anytime below:
                  </p>

                  {/* Inquiry Table Preview */}
                  <div style={{
                    maxHeight: "135px", overflowY: "auto", border: "1px solid #e2e8f0",
                    borderRadius: "10px", background: "#fff", marginBottom: "12px"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "6px 10px" }}>Sr.No</th>
                          <th style={{ padding: "6px 10px" }}>Name</th>
                          <th style={{ padding: "6px 10px" }}>Gmail</th>
                          <th style={{ padding: "6px 10px" }}>Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: "16px 10px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                              No inquiries submitted yet. Submit a test inquiry to preview.
                            </td>
                          </tr>
                        ) : (
                          inquiries.map((inq) => (
                            <tr key={inq.srNo} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "6px 10px", fontWeight: 700 }}>#{inq.srNo}</td>
                              <td style={{ padding: "6px 10px", fontWeight: 600 }}>{inq.name}</td>
                              <td style={{ padding: "6px 10px", color: "#64748b" }}>{inq.gmail}</td>
                              <td style={{ padding: "6px 10px", color: "#64748b" }}>{inq.contact}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button onClick={handleExportExcel} style={{
                  width: "100%", padding: "10px 16px", borderRadius: "10px",
                  background: "#16a34a", color: "#fff", border: "none",
                  fontSize: "13.5px", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.25)"
                }}>
                  <Download size={16} /> Download Excel Sheet (.xlsx)
                </button>
              </div>

            </div>
          </div>
        </section>
        )}

        {/* Footer: Professional Email Contact & Branding Footer */}
        <footer style={{
          background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(20px)",
          color: "#f8fafc", padding: "60px 40px 30px", borderTop: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ maxWidth: "1150px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: "40px", marginBottom: "40px" }}>
            
            {/* Column 1: Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <GraduationCap size={20} color="#fff" />
                </div>
                <span style={{ fontSize: "20px", fontWeight: 900, color: "#fff" }}>
                  EduFlow <span style={{ color: "var(--color-accent)" }}>ECRM</span>
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, maxWidth: "300px" }}>
                The complete web-based Institution OS for schools, colleges, and coaching institutes across India. Streamlining admissions, fees, exams, and attendance.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Quick Navigation
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#cbd5e1" }}>
                <li><a href="#about" style={{ color: "#cbd5e1", textDecoration: "none" }}>About ECRM</a></li>
                <li><a href="#modules" style={{ color: "#cbd5e1", textDecoration: "none" }}>Modules</a></li>
                <li><a href="#pricing" style={{ color: "#cbd5e1", textDecoration: "none" }}>Pricing Plans</a></li>
                <li><a href="#contact-inquiry" style={{ color: "#cbd5e1", textDecoration: "none" }}>Inquiry & Demo</a></li>
              </ul>
            </div>

            {/* Column 3: Modules */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Core Features
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#cbd5e1" }}>
                <li>Student Lifecycle</li>
                <li>Fee Receipts & Invoicing</li>
                <li>Exams & Marksheets</li>
                <li>SMS & WhatsApp Sync</li>
              </ul>
            </div>

            {/* Column 4: Email & Contact Me */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Contact Me / Direct Support
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#cbd5e1" }}>
                <a href="mailto:vishwakarmadharmendra5668@gmail.com" style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-accent)", textDecoration: "none", fontWeight: 700 }}>
                  <Mail size={16} /> vishwakarmadharmendra5668@gmail.com
                </a>
                <a href="tel:8383999973" style={{ display: "flex", alignItems: "center", gap: "10px", color: "#cbd5e1", textDecoration: "none", fontWeight: 600 }}>
                  <Phone size={16} color="#94a3b8" /> +91 8383999973
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <MapPin size={16} color="#94a3b8" /> New Delhi, India
                </div>
              </div>
            </div>

          </div>

          <div style={{
            maxWidth: "1150px", margin: "0 auto", paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex",
            justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b"
          }}>
            <div>
              &copy; {new Date().getFullYear()} EduFlow ECRM Inc. All rights reserved.
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security</span>
            </div>
          </div>
        </footer>

        </div>
      </div>
    </div>
  );
}

