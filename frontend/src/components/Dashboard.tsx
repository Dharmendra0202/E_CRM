import React from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { StudentDashboard } from "./StudentDashboard";
import {
  Users2, IndianRupee, UserCheck, Target, TrendingUp,
  ArrowUpRight, CalendarDays, BookOpen, GraduationCap,
  BarChart3, Clock, AlertCircle, Zap,
  Plus, CheckCircle2, Activity, Layers, Bell, FileText,
  Upload, Sparkles, ShieldCheck, User, MessageSquare, Award,
  ChevronRight, Download, AlertTriangle, ArrowRight, UserCog
} from "lucide-react";

interface DashboardProps {
  isLoading: boolean;
  leadsList: any[];
  invoicesList: any[];
  attendanceList: any[];
  batchesList: any[];
  staffList: any[];
  userName: string;
  userRole?: string;
  onNavigate: (view: string, opts?: any) => void;
}

export function Dashboard({
  isLoading,
  leadsList,
  invoicesList,
  attendanceList,
  batchesList,
  staffList,
  userName,
  userRole = "STUDENT",
  onNavigate,
}: DashboardProps) {
  // Derived Real Database Statistics
  const totalStudents = leadsList.length;
  const enrolledStudents = leadsList.filter((s) => s.status === "ENROLLED").length;
  const newStudents = leadsList.filter((s) => s.status === "NEW").length;

  const studentsThisMonth = leadsList.filter((s) => {
    if (!s.createdAt) return false;
    const d = new Date(s.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalBatches = batchesList.length;
  const totalTeachers = staffList.filter(s => s.role === "TEACHER").length;
  const totalStaffOnly = staffList.filter(s => s.role !== "TEACHER").length;

  const totalFeesCollected = invoicesList.reduce((sum, inv) => {
    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
    return sum + paid;
  }, 0);
  const totalBilled = invoicesList.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalFeesCollected / totalBilled) * 100) : 0;

  const totalAttendanceRecords = attendanceList.length;
  const presentCount = attendanceList.filter((a) => a.status === "PRESENT").length;
  const lateCount = attendanceList.filter((a) => a.status === "LATE").length;
  const absentCount = attendanceList.filter((a) => a.status === "ABSENT").length;
  const avgAttendance = totalAttendanceRecords > 0
    ? ((presentCount + lateCount) / totalAttendanceRecords) * 100
    : 0;

  const unpaidInvoices = invoicesList.filter(inv => inv.status === "UNPAID");

  // Find Student's assigned Batch if available
  const matchingStudentRecord = leadsList.find(s =>
    (s.email && s.email.toLowerCase() === userName.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(userName.toLowerCase()))
  );
  const studentAssignedBatch = matchingStudentRecord?.source || "Not Enrolled";

  const currentRole = (userRole || "ADMIN").toUpperCase();
  const isAdmin = currentRole === "ADMIN" || currentRole === "SUPER_ADMIN";
  const isTeacher = currentRole === "TEACHER";
  const isStudent = currentRole === "STUDENT";
  const isStaff = currentRole === "STAFF";

  // KPI Cards Config (All Clickable & Linked)
  // `trend: "up"` → green + TrendingUp icon (real positive movement, non-zero only).
  // `trend: "neutral"` → gray, no trend icon (static counts / zero values).
  // The badge only reads as "success" green when the underlying number is actually > 0.
  const kpiCards = [
    {
      icon: <Users2 size={20} />,
      gradient: "linear-gradient(135deg, #007bff, #0069d9)",
      label: "Total students",
      value: totalStudents,
      badge: `+${studentsThisMonth} this month`,
      trend: studentsThisMonth > 0 ? "up" : "neutral",
      onClick: () => onNavigate("leads"),
    },
    {
      icon: <IndianRupee size={20} />,
      gradient: "linear-gradient(135deg, hsl(142,70%,42%), hsl(160,70%,35%))",
      label: "Fees collected",
      value: `₹${totalFeesCollected.toLocaleString("en-IN")}`,
      isCurrency: true,
      badge: `${collectionRate}% of target`,
      trend: collectionRate > 0 ? "up" : "neutral",
      onClick: () => onNavigate("billing"),
    },
    {
      icon: <UserCheck size={20} />,
      gradient: "linear-gradient(135deg, #0069d9, hsl(240,80%,65%))",
      label: "Avg attendance",
      value: `${avgAttendance.toFixed(1)}%`,
      badge: `${totalAttendanceRecords} records`,
      trend: "neutral" as const,
      onClick: () => onNavigate("attendance"),
    },
    {
      icon: <Target size={20} />,
      gradient: "linear-gradient(135deg, hsl(38,92%,50%), hsl(20,95%,55%))",
      label: "Enrolled students",
      value: enrolledStudents,
      badge: `${newStudents} new today`,
      trend: newStudents > 0 ? "up" : "neutral",
      onClick: () => onNavigate("leads"),
    },
  ];

  // Bento Navigation Cards Config (All Clickable)
  // `primary` marks the handful of most-frequent tasks. Quick Navigation only
  // renders these (max 5) so it stays a focused shortcut strip, not a full
  // duplicate of the sidebar. Each card carries a live data summary in `desc`.
  const moduleCards = [
    { icon: <Users2 size={22} />, label: "Students", desc: `${totalStudents} registered`, color: "#007bff", view: "leads", primary: true },
    { icon: <Target size={22} />, label: "Admissions", desc: "CRM pipeline", color: "#0069d9", view: "admissions", primary: true },
    { icon: <GraduationCap size={22} />, label: "Batches", desc: `${totalBatches} active`, color: "#17a2b8", view: "batches" },
    { icon: <CheckCircle2 size={22} />, label: "Attendance", desc: `${avgAttendance.toFixed(0)}% avg rate`, color: "hsl(142,70%,42%)", view: "attendance", primary: true },
    { icon: <IndianRupee size={22} />, label: "Billing", desc: `₹${totalFeesCollected.toLocaleString("en-IN")} collected`, color: "hsl(38,92%,50%)", view: "billing", primary: true },
    { icon: <CalendarDays size={22} />, label: "Timetable", desc: "Manage schedules", color: "hsl(200,70%,45%)", view: "schedule" },
    { icon: <BookOpen size={22} />, label: "Exams", desc: "Results & reports", color: "hsl(205, 85%, 50%)", view: "exams", primary: true },
    { icon: <Activity size={22} />, label: "Homework", desc: "Assignments & grading", color: "hsl(200,70%,45%)", view: "homework" },
    { icon: <Layers size={22} />, label: "Staff", desc: `${totalStaffOnly} members`, color: "hsl(260,91%,55%)", view: "staff" },
    { icon: <UserCog size={22} />, label: "Teachers", desc: `${totalTeachers} registered`, color: "hsl(142,70%,42%)", view: "teachers" },
    { icon: <BarChart3 size={22} />, label: "Reports", desc: "Analytics & insights", color: "hsl(38,70%,45%)", view: "reports" },
  ];

  const allowedModuleViews: Record<string, string[]> = {
    ADMIN: moduleCards.map(c => c.view),
    SUPER_ADMIN: moduleCards.map(c => c.view),
    TEACHER: ["leads", "attendance", "schedule", "exams", "homework", "communication"],
    STAFF: ["leads", "attendance", "billing", "communication"],
    STUDENT: ["schedule", "attendance", "exams", "homework"],
  };
  // Only the top few tasks the current role can access — capped at 5 to avoid
  // duplicating the full sidebar. Prefer `primary` tasks, then fill up to 5.
  const roleAllowed = moduleCards.filter(c => (allowedModuleViews[currentRole] || allowedModuleViews.STUDENT).includes(c.view));
  const primaryAllowed = roleAllowed.filter(c => c.primary);
  const visibleModuleCards = (primaryAllowed.length ? primaryAllowed : roleAllowed).slice(0, 5);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "30px" }}>

      {/* ========================================================================= */}
      {/* 🎓 STUDENT DASHBOARD VIEW (100% PRODUCTION READY & FULLY CLICKABLE)       */}
      {/* ========================================================================= */}
      {isStudent && (
        <StudentDashboard userName={userName} onNavigate={onNavigate} />
      )}

      {/* ========================================================================= */}
      {/* 📚 TEACHER DASHBOARD VIEW (FULLY CLICKABLE)                               */}
      {/* ========================================================================= */}
      {isTeacher && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div onClick={() => onNavigate("schedule")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>My timetable</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>View Schedule →</div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{totalBatches} active batch schedules</p>
            </div>

            <div onClick={() => onNavigate("attendance")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Student attendance</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "hsl(142,70%,35%)", marginTop: "4px" }}>Mark Attendance →</div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Track & record daily attendance</p>
            </div>

            <div onClick={() => onNavigate("homework")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Homework & exams</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#007bff", marginTop: "4px" }}>Manage Assignments →</div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Review homework & exam marks</p>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "7px" }}>
              <Zap size={16} style={{ color: "var(--color-accent)" }} /> Quick Navigation
            </h3>
            <div className="module-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {visibleModuleCards.map((card) => (
                <div
                  key={card.label}
                  onClick={() => onNavigate(card.view)}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "16px 18px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 4px 12px -6px rgba(29,10,39,0.06)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 16px rgba(29,10,39,0.06), 0 8px 24px -6px ${card.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,10,39,0.04), 0 4px 12px -6px rgba(29,10,39,0.06)";
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: `${card.color}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: card.color,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{card.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{card.desc}</p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "var(--text-secondary)", opacity: 0.7, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💼 STAFF DASHBOARD VIEW (FULLY CLICKABLE)                                 */}
      {/* ========================================================================= */}
      {isStaff && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div onClick={() => onNavigate("billing")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Collect fees</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "hsl(38,92%,45%)", marginTop: "4px" }}>Fee Billing →</div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{unpaidInvoices.length} pending fee invoices</p>
            </div>
            <div onClick={() => onNavigate("leads")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Student directory</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#17a2b8", marginTop: "4px" }}>{totalStudents} Students</div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Manage registrations & records</p>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "7px" }}>
              <Zap size={16} style={{ color: "var(--color-accent)" }} /> Quick Navigation
            </h3>
            <div className="module-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {visibleModuleCards.map((card) => (
                <div
                  key={card.label}
                  onClick={() => onNavigate(card.view)}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "16px 18px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 4px 12px -6px rgba(29,10,39,0.06)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 16px rgba(29,10,39,0.06), 0 8px 24px -6px ${card.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,10,39,0.04), 0 4px 12px -6px rgba(29,10,39,0.06)";
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: `${card.color}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: card.color,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{card.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{card.desc}</p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "var(--text-secondary)", opacity: 0.7, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👑 ADMIN CRM DASHBOARD VIEW (100% PRODUCTION READY & FULLY CLICKABLE)     */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* Page heading */}
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-headings)" }}>
              Dashboard
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
              Welcome back{userName ? `, ${userName}` : ""}. Here's your academy at a glance.
            </p>
          </div>

          {/* KPI Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {kpiCards.map((m, i) => (
              <div
                key={i}
                onClick={m.onClick}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "22px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                }}
              >
                {isLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <Skeleton variant="circle" width={44} height={44} />
                    <Skeleton variant="text" width="55%" />
                    <Skeleton variant="text" width="40%" height={30} />
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          background: m.gradient,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                        }}
                      >
                        {m.icon}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: m.trend === "up" ? "var(--color-success)" : "var(--text-secondary)",
                          background: m.trend === "up" ? "hsla(142,70%,42%,0.1)" : "hsla(285,10%,40%,0.08)",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.trend === "up" && <TrendingUp size={11} />}
                        {m.badge}
                      </span>
                    </div>
                    {/* Value is the focal point; label sits directly above it as a tight caption */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.2px" }}>
                        {m.label}
                      </p>
                      <h2 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-headings)" }}>
                        {m.isCurrency ? (
                          <>
                            <span style={{ fontSize: "22px", fontWeight: 700, marginRight: "1px", verticalAlign: "baseline" }}>₹</span>
                            {String(m.value).replace(/^₹/, "")}
                          </>
                        ) : (
                          m.value
                        )}
                      </h2>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Quick Navigation Bento Grid */}
          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "7px" }}>
              <Zap size={16} style={{ color: "var(--color-accent)" }} /> Academy Quick Navigation
            </h3>
            <div className="module-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {visibleModuleCards.map((card) => (
                <div
                  key={card.label}
                  onClick={() => onNavigate(card.view)}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "16px 18px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 4px 12px -6px rgba(29,10,39,0.06)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 16px rgba(29,10,39,0.06), 0 8px 24px -6px ${card.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,10,39,0.04), 0 4px 12px -6px rgba(29,10,39,0.06)";
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: `${card.color}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: card.color,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{card.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{card.desc}</p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "var(--text-secondary)", opacity: 0.7, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Real Pending Fees Highlight */}
          {unpaidInvoices.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "none", boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
                  <AlertCircle size={16} style={{ color: "var(--color-danger)" }} /> Pending Student Fees
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("billing")}
                  rightIcon={<ArrowUpRight size={13} />}
                >
                  View all
                </Button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {unpaidInvoices.slice(0, 5).map((inv, idx) => (
                  <div key={inv.id || idx} onClick={() => onNavigate("billing")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "hsla(205, 85%, 50%,0.04)", borderRadius: "10px", border: "1px solid hsla(205, 85%, 50%,0.1)", cursor: "pointer" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : "Student"}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-danger)" }}>₹{Number(inv.totalAmount).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
