import React from "react";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { StudentDashboard } from "./StudentDashboard";
import {
  Users2, IndianRupee, UserCheck, Target, TrendingUp,
  ArrowUpRight, CalendarDays, BookOpen, GraduationCap,
  BarChart3, Clock, AlertCircle, Zap,
  Plus, CheckCircle2, Activity, Layers, Bell, FileText,
  Upload, Sparkles, ShieldCheck, User, MessageSquare, Award,
  ChevronRight, Download, AlertTriangle, ArrowRight
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
  userRole = "ADMIN",
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
  const kpiCards = [
    {
      icon: <Users2 size={20} />,
      gradient: "linear-gradient(135deg, hsl(202, 90%, 58%), hsl(200, 85%, 48%))",
      label: "TOTAL STUDENTS",
      value: totalStudents,
      badge: `+${studentsThisMonth} this month`,
      badgeColor: "var(--color-success)",
      onClick: () => onNavigate("leads"),
    },
    {
      icon: <IndianRupee size={20} />,
      gradient: "linear-gradient(135deg, hsl(142,70%,42%), hsl(160,70%,35%))",
      label: "FEES COLLECTED",
      value: `₹${totalFeesCollected.toLocaleString("en-IN")}`,
      badge: `${collectionRate}% of target`,
      badgeColor: "var(--color-success)",
      onClick: () => onNavigate("billing"),
    },
    {
      icon: <UserCheck size={20} />,
      gradient: "linear-gradient(135deg, hsl(200, 85%, 48%), hsl(240,80%,65%))",
      label: "AVG ATTENDANCE",
      value: `${avgAttendance.toFixed(1)}%`,
      badge: `${totalAttendanceRecords} records`,
      badgeColor: "var(--color-success)",
      onClick: () => onNavigate("attendance"),
    },
    {
      icon: <Target size={20} />,
      gradient: "linear-gradient(135deg, hsl(38,92%,50%), hsl(20,95%,55%))",
      label: "ENROLLED STUDENTS",
      value: enrolledStudents,
      badge: `${newStudents} new today`,
      badgeColor: "var(--color-success)",
      onClick: () => onNavigate("leads"),
    },
  ];

  // Bento Navigation Cards Config (All Clickable)
  const moduleCards = [
    { icon: <Users2 size={22} />, label: "Students", desc: `${totalStudents} registered`, color: "hsl(202, 90%, 58%)", view: "leads" },
    { icon: <Target size={22} />, label: "Admissions", desc: "CRM pipeline", color: "hsl(200, 85%, 48%)", view: "admissions" },
    { icon: <GraduationCap size={22} />, label: "Batches", desc: `${totalBatches} active`, color: "hsl(200,95%,50%)", view: "batches" },
    { icon: <CheckCircle2 size={22} />, label: "Attendance", desc: `${avgAttendance.toFixed(0)}% avg rate`, color: "hsl(142,70%,42%)", view: "attendance" },
    { icon: <IndianRupee size={22} />, label: "Billing", desc: `₹${totalFeesCollected.toLocaleString("en-IN")} collected`, color: "hsl(38,92%,50%)", view: "billing" },
    { icon: <CalendarDays size={22} />, label: "Timetable", desc: "Manage schedules", color: "hsl(200,70%,45%)", view: "schedule" },
    { icon: <BookOpen size={22} />, label: "Exams", desc: "Results & reports", color: "hsl(205, 85%, 50%)", view: "exams" },
    { icon: <Activity size={22} />, label: "Homework", desc: "Assignments & grading", color: "hsl(200,70%,45%)", view: "homework" },
    { icon: <Layers size={22} />, label: "Staff", desc: `${totalStaffOnly} members`, color: "hsl(260,91%,55%)", view: "staff" },
    { icon: <GraduationCap size={22} />, label: "Teachers", desc: `${totalTeachers} registered`, color: "hsl(142,70%,42%)", view: "teachers" },
    { icon: <BarChart3 size={22} />, label: "Reports", desc: "Analytics & insights", color: "hsl(38,70%,45%)", view: "reports" },
  ];

  const allowedModuleViews: Record<string, string[]> = {
    ADMIN: moduleCards.map(c => c.view),
    SUPER_ADMIN: moduleCards.map(c => c.view),
    TEACHER: ["leads", "attendance", "schedule", "exams", "homework", "communication"],
    STAFF: ["leads", "attendance", "billing", "communication"],
    STUDENT: ["schedule", "attendance", "exams", "homework"],
  };
  const visibleModuleCards = moduleCards.filter(c => (allowedModuleViews[currentRole] || allowedModuleViews.STUDENT).includes(c.view));

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
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>MY TIMETABLE</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>View Schedule →</div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{totalBatches} active batch schedules</p>
            </div>

            <div onClick={() => onNavigate("attendance")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>STUDENT ATTENDANCE</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "hsl(142,70%,35%)", marginTop: "4px" }}>Mark Attendance →</div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>Track & record daily attendance</p>
            </div>

            <div onClick={() => onNavigate("homework")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>HOMEWORK & EXAMS</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "hsl(202, 90%, 58%)", marginTop: "4px" }}>Manage Assignments →</div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>Review homework & exam marks</p>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "7px" }}>
              <Zap size={16} style={{ color: "var(--color-accent)" }} /> Quick Navigation
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              {visibleModuleCards.map((card) => (
                <div
                  key={card.label}
                  onClick={() => onNavigate(card.view)}
                  style={{
                    background: "#fff",
                    borderRadius: "14px",
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
                      borderRadius: "11px",
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
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{card.desc}</p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "var(--text-secondary)", opacity: 0.4, flexShrink: 0 }} />
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
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>COLLECT FEES</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "hsl(38,92%,45%)", marginTop: "4px" }}>Fee Billing →</div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{unpaidInvoices.length} pending fee invoices</p>
            </div>
            <div onClick={() => onNavigate("leads")} style={{ background: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer", border: "1px solid hsla(285,40%,60%,0.1)", transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>STUDENT DIRECTORY</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "hsl(200,95%,45%)", marginTop: "4px" }}>{totalStudents} Students</div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>Manage registrations & records</p>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "7px" }}>
              <Zap size={16} style={{ color: "var(--color-accent)" }} /> Quick Navigation
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              {visibleModuleCards.map((card) => (
                <div
                  key={card.label}
                  onClick={() => onNavigate(card.view)}
                  style={{
                    background: "#fff",
                    borderRadius: "14px",
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
                      borderRadius: "11px",
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
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{card.desc}</p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "var(--text-secondary)", opacity: 0.4, flexShrink: 0 }} />
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
                          fontSize: "11px",
                          fontWeight: 700,
                          color: m.badgeColor,
                          background: "hsla(142,70%,42%,0.1)",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <TrendingUp size={10} />
                        {m.badge}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                      {m.label}
                    </p>
                    <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-headings)" }}>
                      {m.value}
                    </h2>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              {visibleModuleCards.map((card) => (
                <div
                  key={card.label}
                  onClick={() => onNavigate(card.view)}
                  style={{
                    background: "#fff",
                    borderRadius: "14px",
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
                      borderRadius: "11px",
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
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{card.desc}</p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "var(--text-secondary)", opacity: 0.4, flexShrink: 0 }} />
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
                <button onClick={() => onNavigate("billing")} style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(202, 90%, 58%,0.07)", border: "1px solid hsla(202, 90%, 58%,0.18)", borderRadius: "8px", padding: "5px 11px", cursor: "pointer" }}>
                  View All <ArrowUpRight size={11} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {unpaidInvoices.slice(0, 5).map((inv, idx) => (
                  <div key={inv.id || idx} onClick={() => onNavigate("billing")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "hsla(205, 85%, 50%,0.04)", borderRadius: "10px", border: "1px solid hsla(205, 85%, 50%,0.1)", cursor: "pointer" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : "Student"}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")}</p>
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
