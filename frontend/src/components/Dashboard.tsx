import React from "react";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import {
  Users2, IndianRupee, UserCheck, Target, TrendingUp,
  ArrowUpRight, CalendarDays, BookOpen, GraduationCap,
  BarChart3, Clock, AlertCircle, XCircle, Zap,
  Plus, CheckCircle2, Activity, Layers,
} from "lucide-react";

interface DashboardProps {
  isLoading: boolean;
  leadsList: any[];
  invoicesList: any[];
  attendanceList: any[];
  batchesList: any[];
  staffList: any[];
  userName: string;
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
  onNavigate,
}: DashboardProps) {
  // ── Derived Real Stats ──
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
  const totalStaff = staffList.length;

  const totalFeesCollected = invoicesList.reduce((sum, inv) => {
    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
    return sum + paid;
  }, 0);
  const totalBilled = invoicesList.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalFeesCollected / totalBilled) * 100) : 0;

  const avgAttendance =
    attendanceList.length > 0
      ? (attendanceList.filter((a) => a.status === "PRESENT" || a.status === "LATE").length / attendanceList.length) * 100
      : 0;

  const overdueInvoices = invoicesList.filter(
    (inv) => inv.status === "UNPAID" && new Date(inv.dueDate) < new Date()
  ).length;

  // ── KPI Cards Config ──
  const kpiCards = [
    {
      icon: <Users2 size={20} />,
      gradient: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
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
      gradient: "linear-gradient(135deg, hsl(271,91%,60%), hsl(240,80%,65%))",
      label: "AVG ATTENDANCE",
      value: `${avgAttendance.toFixed(1)}%`,
      badge: `${attendanceList.length} records`,
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

  // ── Bento Grid Module Cards ──
  const moduleCards = [
    { icon: <Users2 size={22} />, label: "Students", desc: `${totalStudents} registered`, color: "hsl(328,100%,54%)", view: "leads" },
    { icon: <Target size={22} />, label: "Admissions", desc: "CRM pipeline", color: "hsl(271,91%,60%)", view: "admissions" },
    { icon: <GraduationCap size={22} />, label: "Batches", desc: `${totalBatches} active`, color: "hsl(200,95%,50%)", view: "schedule" },
    { icon: <CheckCircle2 size={22} />, label: "Attendance", desc: `${avgAttendance.toFixed(0)}% avg rate`, color: "hsl(142,70%,42%)", view: "attendance" },
    { icon: <IndianRupee size={22} />, label: "Billing", desc: `₹${totalFeesCollected.toLocaleString("en-IN")} collected`, color: "hsl(38,92%,50%)", view: "billing" },
    { icon: <CalendarDays size={22} />, label: "Timetable", desc: "Manage schedules", color: "hsl(200,70%,45%)", view: "schedule" },
    { icon: <BookOpen size={22} />, label: "Exams", desc: "Results & reports", color: "hsl(342,90%,48%)", view: "exams" },
    { icon: <GraduationCap size={22} />, label: "Academics", desc: "Subjects & courses", color: "hsl(260,80%,55%)", view: "academics" },
    { icon: <Activity size={22} />, label: "Homework", desc: "Assignments & grading", color: "hsl(200,70%,45%)", view: "homework" },
    { icon: <Layers size={22} />, label: "Staff", desc: `${totalStaff} members`, color: "hsl(260,91%,55%)", view: "staff" },
    { icon: <Users2 size={22} />, label: "Parents", desc: "Directory & contacts", color: "hsl(172,70%,35%)", view: "parents" },
    { icon: <Activity size={22} />, label: "Reports", desc: "Analytics & insights", color: "hsl(38,70%,45%)", view: "reports" },
  ];

  return (
    <div className="animate-fade-in">
      {/* ── Hero Welcome Banner (Clean, no action buttons) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, hsl(328,100%,54%) 0%, hsl(271,91%,60%) 55%, hsl(240,80%,65%) 100%)",
          borderRadius: "20px",
          padding: "28px 32px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 16px 48px -8px hsla(328,100%,54%,0.35)",
        }}
      >
        <div style={{ position: "absolute", top: "-40px", right: "200px", width: "180px", height: "180px", borderRadius: "50%", background: "hsla(0,0%,100%,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-50px", right: "60px", width: "140px", height: "140px", borderRadius: "50%", background: "hsla(0,0%,100%,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: "11px", color: "hsla(0,0%,100%,0.7)", fontWeight: 700, margin: "0 0 6px", letterSpacing: "1px", textTransform: "uppercase" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "#fff" }}>
            Welcome back, {userName.split(" ")[0]} 👋
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "hsla(0,0%,100%,0.72)" }}>
            Here's what's happening at your academy today.
          </p>
        </div>
      </div>

      {/* ── KPI Stat Cards (Clickable) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px", marginBottom: "24px" }}>
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
              const el = e.currentTarget;
              el.style.transform = "translateY(-3px)";
              el.style.boxShadow = "0 4px 16px rgba(29,10,39,0.06), 0 12px 32px -8px rgba(29,10,39,0.12)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = "none";
              el.style.boxShadow = "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)";
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

      {/* ── Bento Grid: Module Navigation Cards (All Clickable) ── */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
          <Zap size={16} style={{ color: "var(--color-accent)" }} /> Quick Navigation
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {moduleCards.map((card) => (
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
                const el = e.currentTarget;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = `0 4px 16px rgba(29,10,39,0.06), 0 8px 24px -6px ${card.color}25`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "none";
                el.style.boxShadow = "0 2px 8px rgba(29,10,39,0.04), 0 4px 12px -6px rgba(29,10,39,0.06)";
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

      {/* ── Two Column: Recent Students + Enrollment Overview ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Recent Students */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "none", boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid hsla(285,30%,20%,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Recent Students</h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>Latest registrations</p>
            </div>
            <button
              onClick={() => onNavigate("leads")}
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.07)", border: "1px solid hsla(328,100%,54%,0.18)", borderRadius: "8px", padding: "5px 11px", cursor: "pointer" }}
            >
              View All <ArrowUpRight size={12} />
            </button>
          </div>
          {isLoading ? (
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rect" height={48} />)}
            </div>
          ) : leadsList.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Users2 size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>No students yet</p>
            </div>
          ) : (
            leadsList.slice(0, 5).map((student, idx) => (
              <div
                key={student.id}
                onClick={() => onNavigate("leads")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 20px",
                  borderBottom: idx < 4 ? "1px solid hsla(285,30%,20%,0.05)" : "none",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "hsla(328,100%,54%,0.02)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: student.status === "ENROLLED" ? "hsla(142,70%,45%,0.15)" : "hsla(200,95%,50%,0.15)",
                    border: `1.5px solid ${student.status === "ENROLLED" ? "hsla(142,70%,45%,0.3)" : "hsla(200,95%,50%,0.3)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: student.status === "ENROLLED" ? "var(--color-success)" : "var(--color-info)",
                    flexShrink: 0,
                  }}
                >
                  {student.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {student.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                    {student.source || "—"} · {student.phone || student.email}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: student.status === "ENROLLED" ? "var(--color-success)" : "var(--color-info)",
                    background: student.status === "ENROLLED" ? "hsla(142,70%,45%,0.1)" : "hsla(200,95%,50%,0.1)",
                    padding: "3px 9px",
                    borderRadius: "20px",
                    flexShrink: 0,
                  }}
                >
                  {student.status === "ENROLLED" ? "Enrolled" : "New"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Enrollment Overview */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "none", boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
            <BarChart3 size={16} style={{ color: "var(--color-accent)" }} /> Enrollment Overview
          </h3>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rect" height={50} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Enrolled", count: enrolledStudents, color: "var(--color-success)", pct: totalStudents > 0 ? Math.round((enrolledStudents / totalStudents) * 100) : 0 },
                { label: "New (Pending)", count: newStudents, color: "var(--color-info)", pct: totalStudents > 0 ? Math.round((newStudents / totalStudents) * 100) : 0 },
                { label: "Total Batches", count: totalBatches, color: "hsl(271,91%,60%)", pct: 100 },
                { label: "Total Staff", count: totalStaff, color: "hsl(38,92%,50%)", pct: 100 },
              ].map((item) => (
                <div key={item.label} style={{ padding: "14px", background: `${item.color}08`, borderRadius: "12px", border: `1px solid ${item.color}18` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{item.label}</p>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: item.color }}>{item.count}</span>
                  </div>
                  <div style={{ height: "4px", background: `${item.color}15`, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "2px", transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overdue Warning */}
          {overdueInvoices > 0 && (
            <div style={{ marginTop: "14px", padding: "12px", background: "hsla(342,90%,48%,0.06)", borderRadius: "10px", border: "1px solid hsla(342,90%,48%,0.12)", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={16} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                {overdueInvoices} overdue invoice{overdueInvoices > 1 ? "s" : ""} need attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions Row ── */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "18px 20px", border: "none", boxShadow: "0 2px 8px rgba(29,10,39,0.04), 0 8px 24px -8px rgba(29,10,39,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={12} color="#fff" />
          </span>
          Quick Actions
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
          {[
            { label: "Add New Student", icon: <Plus size={14} />, action: () => onNavigate("leads", { tab: "add" }), color: "hsl(328,100%,54%)" },
            { label: "Mark Attendance", icon: <CheckCircle2 size={14} />, action: () => onNavigate("attendance"), color: "hsl(142,70%,42%)" },
            { label: "Issue Invoice", icon: <IndianRupee size={14} />, action: () => onNavigate("billing"), color: "hsl(38,92%,50%)" },
            { label: "Schedule Class", icon: <CalendarDays size={14} />, action: () => onNavigate("schedule"), color: "hsl(271,91%,60%)" },
            { label: "View Exams", icon: <BookOpen size={14} />, action: () => onNavigate("exams"), color: "hsl(342,90%,48%)" },
            { label: "Manage Staff", icon: <Users2 size={14} />, action: () => onNavigate("staff"), color: "hsl(200,95%,50%)" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: `${a.color}08`,
                border: `1px solid ${a.color}1a`,
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
                transition: "all 0.2s",
                textAlign: "left",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = `${a.color}14`;
                el.style.transform = "translateX(3px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = `${a.color}08`;
                el.style.transform = "none";
              }}
            >
              <span style={{ color: a.color, display: "flex" }}>{a.icon}</span>
              {a.label}
              <ArrowUpRight size={11} style={{ marginLeft: "auto", opacity: 0.35 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
