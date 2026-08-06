import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api";
import {
  X, User, BookOpen, Calendar, IndianRupee, Activity,
  CheckCircle2, XCircle, Clock, TrendingUp, Phone, Mail,
  GraduationCap, ArrowLeft, Award, BarChart3, Target,
  Users2, FileText,
} from "lucide-react";

interface StudentProfileProps {
  studentId: string;
  onClose: () => void;
}

export function StudentProfile({ studentId, onClose }: StudentProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadProfile(); }, [studentId]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.students.getProfile(studentId);
      if (res.data) setProfile(res.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        <div style={{ width: "90vw", maxWidth: "1100px", height: "85vh", background: "#fff", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Skeleton variant="rect" height={60} />
          <div style={{ display: "flex", gap: "20px", flex: 1 }}>
            <div style={{ flex: 1 }}><Skeleton variant="rect" height="100%" /></div>
            <div style={{ flex: 2 }}><Skeleton variant="rect" height="100%" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { user, stats, enrollments, invoices, attendance } = profile;
  const name = user ? `${user.firstName} ${user.lastName}` : profile.parentName;
  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const currentBatch = enrollments?.[0]?.batch;

  // Attendance breakdown
  const totalClasses = attendance?.length || 0;
  const presentCount = attendance?.filter((a: any) => a.status === "PRESENT").length || 0;
  const absentCount = attendance?.filter((a: any) => a.status === "ABSENT").length || 0;
  const lateCount = attendance?.filter((a: any) => a.status === "LATE").length || 0;

  // Monthly attendance grouping
  const monthlyAttendance: Record<string, { total: number; present: number }> = {};
  for (const a of (attendance || [])) {
    const month = new Date(a.classDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    if (!monthlyAttendance[month]) monthlyAttendance[month] = { total: 0, present: 0 };
    monthlyAttendance[month].total++;
    if (a.status === "PRESENT" || a.status === "LATE") monthlyAttendance[month].present++;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "1100px", height: "85vh", background: "#fff", borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px -12px rgba(29,10,39,0.25)" }} className="animate-fade-in">

        {/* Top Bar */}
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(29,10,39,0.04)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}><ArrowLeft size={20} /></button>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff" }}>
              {initials}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>{name}</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                {currentBatch?.name || "No batch"} · {user?.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={20} /></button>
        </div>

        {/* Main Content: 2-column split */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ═══ LEFT PANEL: Student Data ═══ */}
          <div style={{ width: "320px", borderRight: "1px solid rgba(29,10,39,0.04)", overflowY: "auto", padding: "20px", flexShrink: 0 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Student Information</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Full Name", value: name, icon: <User size={14} /> },
                { label: "Email", value: user?.email || "—", icon: <Mail size={14} /> },
                { label: "Phone", value: user?.phone || "—", icon: <Phone size={14} /> },
                { label: "Date of Birth", value: new Date(profile.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <Calendar size={14} /> },
                { label: "Joined", value: new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <Clock size={14} /> },
              ].map((item, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ color: "var(--text-secondary)", display: "flex" }}>{item.icon}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{item.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", paddingLeft: "22px" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Parent/Guardian */}
            <h3 style={{ margin: "20px 0 12px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Parent / Guardian</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Name", value: profile.parentName },
                { label: "Phone", value: profile.parentPhone },
                { label: "Email", value: profile.parentEmail },
              ].map((item, i) => (
                <div key={i} style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Batch Info */}
            <h3 style={{ margin: "20px 0 12px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Enrollment</h3>
            {enrollments?.length > 0 ? enrollments.map((e: any) => (
              <div key={e.id} style={{ padding: "12px", background: "hsla(271,91%,60%,0.04)", borderRadius: "10px", marginBottom: "8px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700 }}>{e.batch?.name}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                  {e.batch?.subject} · Fee: ₹{Number(e.batch?.feeAmount || 0).toLocaleString("en-IN")}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "10px", color: "var(--color-success)", fontWeight: 700 }}>{e.status}</p>
              </div>
            )) : (
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Not enrolled in any batch.</p>
            )}

            {/* Fee Summary */}
            <h3 style={{ margin: "20px 0 12px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Fee Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ padding: "10px", background: "hsla(142,70%,42%,0.05)", borderRadius: "8px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--color-success)" }}>₹{stats.totalPaid.toLocaleString("en-IN")}</p>
                <p style={{ margin: "2px 0 0", fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Paid</p>
              </div>
              <div style={{ padding: "10px", background: stats.outstanding > 0 ? "hsla(342,90%,48%,0.05)" : "hsla(142,70%,42%,0.05)", borderRadius: "8px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: stats.outstanding > 0 ? "var(--color-danger)" : "var(--color-success)" }}>₹{stats.outstanding.toLocaleString("en-IN")}</p>
                <p style={{ margin: "2px 0 0", fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Due</p>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT PANEL: Performance & Academics ═══ */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {/* Performance Overview Cards */}
            <h3 style={{ margin: "0 0 14px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Performance Overview</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Attendance", value: `${stats.attendanceRate}%`, color: stats.attendanceRate >= 75 ? "var(--color-success)" : "var(--color-danger)", icon: <Activity size={16} /> },
                { label: "Classes", value: totalClasses, color: "hsl(271,91%,60%)", icon: <BookOpen size={16} /> },
                { label: "Present", value: presentCount, color: "var(--color-success)", icon: <CheckCircle2 size={16} /> },
                { label: "Absent", value: absentCount, color: "var(--color-danger)", icon: <XCircle size={16} /> },
              ].map((s, i) => (
                <div key={i} style={{ padding: "14px", background: `${s.color}08`, borderRadius: "12px", textAlign: "center" }}>
                  <span style={{ display: "flex", justifyContent: "center", color: s.color, marginBottom: "6px" }}>{s.icon}</span>
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly Attendance Chart (Visual Bar) */}
            <h3 style={{ margin: "0 0 14px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Monthly Attendance Trend</h3>
            {Object.keys(monthlyAttendance).length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px" }}>No attendance records yet.</p>
            ) : (
              <div style={{ display: "flex", gap: "8px", marginBottom: "24px", alignItems: "flex-end", height: "100px" }}>
                {Object.entries(monthlyAttendance).slice(-6).map(([month, data]) => {
                  const pct = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
                  return (
                    <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: pct >= 75 ? "var(--color-success)" : "var(--color-danger)" }}>{pct}%</span>
                      <div style={{ width: "100%", background: "var(--bg-secondary)", borderRadius: "6px", height: "70px", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${pct}%`, background: pct >= 75 ? "var(--color-success)" : "var(--color-danger)", borderRadius: "6px", transition: "height 0.5s ease" }} />
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-secondary)" }}>{month}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent Attendance Records */}
            <h3 style={{ margin: "0 0 14px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Recent Attendance ({totalClasses} records)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px", maxHeight: "200px", overflowY: "auto" }}>
              {(attendance || []).slice(0, 20).map((a: any) => {
                const statusColor = a.status === "PRESENT" ? "var(--color-success)" : a.status === "LATE" ? "hsl(38,92%,50%)" : "var(--color-danger)";
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
                      {new Date(a.classDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{a.schedule?.batch?.name || "—"}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: statusColor, background: `${statusColor}12`, padding: "2px 8px", borderRadius: "8px" }}>{a.status}</span>
                  </div>
                );
              })}
              {totalClasses === 0 && <p style={{ fontSize: "12px", color: "var(--text-secondary)", padding: "12px" }}>No attendance records yet.</p>}
            </div>

            {/* Invoices / Fee History */}
            <h3 style={{ margin: "0 0 14px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Fee History</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {(invoices || []).length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No invoices yet.</p>
              ) : (
                (invoices || []).map((inv: any) => {
                  const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
                  const isPaid = paid >= Number(inv.totalAmount);
                  return (
                    <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                      <IndianRupee size={14} style={{ color: isPaid ? "var(--color-success)" : "var(--color-danger)", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>₹{Number(inv.totalAmount).toLocaleString("en-IN")}</p>
                        <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: isPaid ? "var(--color-success)" : "var(--color-danger)", background: isPaid ? "hsla(142,70%,42%,0.08)" : "hsla(342,90%,48%,0.08)", padding: "3px 8px", borderRadius: "8px" }}>
                        {isPaid ? "PAID" : `Due ₹${(Number(inv.totalAmount) - paid).toLocaleString("en-IN")}`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
