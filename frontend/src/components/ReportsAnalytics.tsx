import React, { useState, useEffect } from "react";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api";
import {
  BarChart3, Users2, IndianRupee, Activity, TrendingUp,
  GraduationCap, BookOpen, Target, CheckCircle2, XCircle, Clock,
} from "lucide-react";

export function ReportsAnalytics() {
  const [overview, setOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.reports.getOverview();
      if (res.data) setOverview(res.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-gradient-indigo" style={{ margin: "0 0 24px" }}>Reports & Analytics</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={100} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={200} />)}
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const { students, staff, batches, homework, finance, attendance, leads } = overview;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Reports & Analytics</h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
          Comprehensive overview of your institution's performance.
        </p>
      </div>

      {/* Top KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Students", value: students, icon: <Users2 size={20} />, color: "hsl(328,100%,54%)" },
          { label: "Staff", value: staff, icon: <GraduationCap size={20} />, color: "hsl(271,91%,60%)" },
          { label: "Batches", value: batches, icon: <BookOpen size={20} />, color: "hsl(200,95%,50%)" },
          { label: "Active Homework", value: homework, icon: <Target size={20} />, color: "hsl(38,92%,50%)" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "18px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${kpi.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color }}>{kpi.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{kpi.label}</p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Detail Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Finance Overview */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-glass)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <IndianRupee size={16} style={{ color: "var(--color-accent)" }} /> Financial Summary
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Total Billed", value: `₹${finance.totalBilled.toLocaleString("en-IN")}`, color: "hsl(271,91%,60%)" },
              { label: "Collected", value: `₹${finance.totalCollected.toLocaleString("en-IN")}`, color: "var(--color-success)" },
              { label: "Outstanding", value: `₹${finance.outstanding.toLocaleString("en-IN")}`, color: "var(--color-danger)" },
              { label: "Collection Rate", value: `${finance.collectionRate}%`, color: "hsl(200,95%,50%)" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: `${item.color}06`, borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Overview */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-glass)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={16} style={{ color: "var(--color-success)" }} /> Attendance Analytics
          </h3>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <p style={{ margin: 0, fontSize: "48px", fontWeight: 800, color: "var(--color-success)" }}>{attendance.avgAttendance}%</p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Average Attendance Rate</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              { label: "Present", value: attendance.present, color: "var(--color-success)", icon: <CheckCircle2 size={14} /> },
              { label: "Absent", value: attendance.absent, color: "var(--color-danger)", icon: <XCircle size={14} /> },
              { label: "Late", value: attendance.late, color: "hsl(38,92%,50%)", icon: <Clock size={14} /> },
            ].map((item, i) => (
              <div key={i} style={{ padding: "10px", background: `${item.color}08`, borderRadius: "10px", textAlign: "center" }}>
                <span style={{ display: "flex", justifyContent: "center", color: item.color, marginBottom: "4px" }}>{item.icon}</span>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: item.color }}>{item.value}</p>
                <p style={{ margin: "2px 0 0", fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Pipeline */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-glass)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart3 size={16} style={{ color: "hsl(271,91%,60%)" }} /> Lead Pipeline ({leads.total} total)
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
          {Object.entries(leads.pipeline).map(([status, count]) => {
            const colors: Record<string, string> = { NEW: "hsl(200,95%,50%)", CONTACTED: "hsl(271,91%,60%)", COUNSELLING: "hsl(38,92%,50%)", FOLLOW_UP: "hsl(328,100%,54%)", ENROLLED: "var(--color-success)", LOST: "var(--color-danger)" };
            const color = colors[status] || "var(--text-secondary)";
            return (
              <div key={status} style={{ padding: "12px", background: `${color}08`, borderRadius: "10px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color }}>{count as number}</p>
                <p style={{ margin: "4px 0 0", fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{status.replace("_", " ")}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
