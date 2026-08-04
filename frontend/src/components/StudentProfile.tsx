import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api";
import {
  X, User, BookOpen, Calendar, IndianRupee, Activity,
  CheckCircle2, XCircle, Clock, TrendingUp, Phone, Mail,
  GraduationCap, ArrowLeft,
} from "lucide-react";

interface StudentProfileProps {
  studentId: string;
  onClose: () => void;
}

type ProfileTab = "info" | "academic" | "attendance" | "fees";

export function StudentProfile({ studentId, onClose }: StudentProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");

  useEffect(() => {
    loadProfile();
  }, [studentId]);

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
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 9999 }}>
        <div style={{ width: "560px", background: "#fff", padding: "24px", overflowY: "auto" }}>
          <Skeleton variant="rect" height={80} />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={60} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { user, stats, enrollments, invoices, attendance } = profile;
  const name = user ? `${user.firstName} ${user.lastName}` : profile.parentName;
  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

  const tabs = [
    { key: "info" as ProfileTab, label: "Info", icon: <User size={14} /> },
    { key: "academic" as ProfileTab, label: "Academic", icon: <BookOpen size={14} /> },
    { key: "attendance" as ProfileTab, label: "Attendance", icon: <Activity size={14} /> },
    { key: "fees" as ProfileTab, label: "Fees", icon: <IndianRupee size={14} /> },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      PRESENT: { color: "var(--color-success)", bg: "hsla(142,70%,42%,0.1)" },
      LATE: { color: "hsl(38,92%,50%)", bg: "hsla(38,92%,50%,0.1)" },
      ABSENT: { color: "var(--color-danger)", bg: "hsla(342,90%,48%,0.1)" },
      PAID: { color: "var(--color-success)", bg: "hsla(142,70%,42%,0.1)" },
      UNPAID: { color: "var(--color-danger)", bg: "hsla(342,90%,48%,0.1)" },
      ACTIVE: { color: "var(--color-success)", bg: "hsla(142,70%,42%,0.1)" },
    };
    const m = map[status] || { color: "var(--text-secondary)", bg: "var(--bg-secondary)" };
    return (
      <span style={{ fontSize: "10px", fontWeight: 700, color: m.color, background: m.bg, padding: "3px 8px", borderRadius: "12px" }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 9999 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "560px", maxWidth: "95vw", background: "#fff", height: "100vh", overflowY: "auto", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)" }} className="animate-fade-in">
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "16px", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><ArrowLeft size={18} /></button>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "hsla(328,100%,54%,0.1)", border: "2px solid hsla(328,100%,54%,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "var(--color-accent)" }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{name}</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>{user?.email}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={18} /></button>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", padding: "16px 24px" }}>
          {[
            { label: "Attendance", value: `${stats.attendanceRate}%`, color: "var(--color-success)" },
            { label: "Classes", value: stats.totalClasses, color: "hsl(271,91%,60%)" },
            { label: "Fees Paid", value: `₹${stats.totalPaid.toLocaleString("en-IN")}`, color: "hsl(142,70%,42%)" },
            { label: "Outstanding", value: `₹${stats.outstanding.toLocaleString("en-IN")}`, color: stats.outstanding > 0 ? "var(--color-danger)" : "var(--color-success)" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "10px", background: `${s.color}08`, borderRadius: "10px", textAlign: "center" }}>
              <p style={{ margin: "0 0 2px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "2px", padding: "0 24px 12px", borderBottom: "1px solid var(--border-glass)" }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px",
                border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, transition: "all 0.2s",
                background: activeTab === tab.key ? "hsla(328,100%,54%,0.08)" : "transparent",
                color: activeTab === tab.key ? "var(--color-accent)" : "var(--text-secondary)",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "20px 24px" }}>
          {/* INFO TAB */}
          {activeTab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Student Details</h4>
              {[
                { label: "Email", value: user?.email, icon: <Mail size={13} /> },
                { label: "Phone", value: user?.phone || "—", icon: <Phone size={13} /> },
                { label: "Date of Birth", value: new Date(profile.dateOfBirth).toLocaleDateString("en-IN"), icon: <Calendar size={13} /> },
                { label: "Joined", value: new Date(profile.createdAt).toLocaleDateString("en-IN"), icon: <Clock size={13} /> },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                  <span style={{ color: "var(--text-secondary)", display: "flex" }}>{item.icon}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", width: "80px" }}>{item.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{item.value}</span>
                </div>
              ))}

              <h4 style={{ margin: "16px 0 4px", fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Parent / Guardian</h4>
              {[
                { label: "Name", value: profile.parentName },
                { label: "Phone", value: profile.parentPhone },
                { label: "Email", value: profile.parentEmail },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", width: "80px" }}>{item.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ACADEMIC TAB */}
          {activeTab === "academic" && (
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Enrolled Batches</h4>
              {enrollments.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>No enrollments found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {enrollments.map((e: any) => (
                    <div key={e.id} style={{ padding: "14px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{e.batch.name}</span>
                        {statusBadge(e.status)}
                      </div>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                        {e.batch.subject} · Teacher: {e.batch.teacher?.user ? `${e.batch.teacher.user.firstName} ${e.batch.teacher.user.lastName}` : "—"}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                        Enrolled: {new Date(e.enrolledAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === "attendance" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Recent Attendance</h4>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success)" }}>Rate: {stats.attendanceRate}%</span>
              </div>
              {attendance.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>No attendance records.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {attendance.slice(0, 20).map((a: any) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", width: "70px" }}>
                        {new Date(a.classDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", flex: 1 }}>{a.schedule?.batch?.name || "—"}</span>
                      {statusBadge(a.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FEES TAB */}
          {activeTab === "fees" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Total Billed", value: `₹${stats.totalFees.toLocaleString("en-IN")}`, color: "hsl(271,91%,60%)" },
                  { label: "Paid", value: `₹${stats.totalPaid.toLocaleString("en-IN")}`, color: "var(--color-success)" },
                  { label: "Due", value: `₹${stats.outstanding.toLocaleString("en-IN")}`, color: "var(--color-danger)" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "12px", background: `${s.color}08`, borderRadius: "10px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)" }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Invoices</h4>
              {invoices.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>No invoices found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {invoices.map((inv: any) => {
                    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
                    return (
                      <div key={inv.id} style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700 }}>₹{Number(inv.totalAmount).toLocaleString("en-IN")}</span>
                          {statusBadge(inv.status)}
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                          Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")} · Paid: ₹{paid.toLocaleString("en-IN")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
