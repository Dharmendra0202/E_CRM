import React, { useState, useEffect } from "react";
import {
  Award, GraduationCap, CheckCircle2, FileText, Plus, Search,
  Download, Printer, Sparkles, BookOpen, Clock, User
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { api } from "../utils/api";

export function ExamsManagement() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stuRes, batchRes] = await Promise.all([
        api.students.getAll(),
        api.batches.getAll(),
      ]);
      if (stuRes.data) setStudents(stuRes.data);
      if (batchRes.data) {
        setBatches(batchRes.data);
        if (batchRes.data.length > 0) setSelectedBatch(batchRes.data[0].name);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  // Derive stats from real data
  const totalStudents = students.length;
  const batchStudents = students.filter(s =>
    s.enrollments?.some((e: any) => e.batch?.name === selectedBatch)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Award size={26} style={{ color: "var(--color-accent)" }} /> Exams & Report Cards
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
            Generate student report cards, track grades & publish exam results.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={14} />}>Create New Exam</Button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { icon: <Award size={22} />, value: "12", label: "TOTAL EXAMS", color: "hsl(328,100%,54%)", bg: "hsla(328,100%,54%,0.08)" },
          { icon: <CheckCircle2 size={22} />, value: "94.2%", label: "PASS RATE", color: "hsl(160,70%,40%)", bg: "hsla(160,70%,40%,0.08)" },
          { icon: <GraduationCap size={22} />, value: String(totalStudents), label: "REPORT CARDS", color: "hsl(271,91%,60%)", bg: "hsla(271,91%,60%,0.08)" },
          { icon: <Sparkles size={22} />, value: "A+", label: "TOP GRADE", color: "hsl(38,92%,50%)", bg: "hsla(38,92%,50%,0.08)" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-glass)",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px",
          }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>{stat.value}</p>
              <p style={{ margin: "4px 0 0", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: 2-col */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Results Ledger */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={16} style={{ color: "var(--color-accent)" }} />
              {selectedBatch || "Class"} Results Ledger
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid var(--border-glass)", fontSize: "11px", fontWeight: 600, background: "transparent", color: "var(--text-primary)", outline: "none" }}
              >
                {batches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                {batches.length === 0 && <option>No batches</option>}
              </select>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {batchStudents.length} Students
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)", background: "rgba(29,10,39,0.02)" }}>
                  {["ROLL NO", "STUDENT NAME", "BATCH", "STATUS", "ACTION"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No students found. Add students first.</td></tr>
                ) : (
                  students.slice(0, 10).map((student, idx) => {
                    const name = student.user ? `${student.user.firstName} ${student.user.lastName}` : student.parentName;
                    const batch = student.enrollments?.[0]?.batch?.name || "—";
                    const status = student.enrollments?.[0]?.status || "—";
                    return (
                      <tr key={student.id} style={{ borderBottom: "1px solid var(--border-glass)", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "hsla(328,100%,54%,0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text-secondary)" }}>#{String(idx + 101)}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{name}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{batch}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: status === "ACTIVE" ? "var(--color-success)" : "var(--text-secondary)", background: status === "ACTIVE" ? "hsla(142,70%,42%,0.08)" : "var(--bg-secondary)", padding: "3px 8px", borderRadius: "10px" }}>
                            {status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => setSelectedStudent(student)}
                            style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.08)", border: "1px solid hsla(328,100%,54%,0.2)", padding: "4px 10px", borderRadius: "8px", cursor: "pointer" }}
                          >
                            Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Card Preview */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid hsla(328,100%,54%,0.15)", padding: "20px", backgroundImage: "linear-gradient(to bottom, #fff, hsla(328,100%,54%,0.02))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid hsla(328,100%,54%,0.1)" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Printer size={16} style={{ color: "var(--color-accent)" }} /> Printable Report Card
            </h3>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#fff", background: "var(--color-accent)", padding: "3px 8px", borderRadius: "6px" }}>LIVE PREVIEW</span>
          </div>

          {selectedStudent ? (
            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid hsla(328,100%,54%,0.15)", padding: "20px", boxShadow: "0 4px 16px rgba(29,10,39,0.06)" }}>
              {/* School Header */}
              <div style={{ textAlign: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border-glass)", marginBottom: "14px" }}>
                <GraduationCap size={28} style={{ color: "var(--color-accent)", marginBottom: "4px" }} />
                <h4 style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 800 }}>E-CRM ACADEMY</h4>
                <p style={{ margin: 0, fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Official Academic Progress Report</p>
              </div>

              {/* Student Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", padding: "10px", background: "hsla(328,100%,54%,0.03)", borderRadius: "10px", border: "1px solid hsla(328,100%,54%,0.08)", marginBottom: "14px", fontSize: "11px" }}>
                <div><span style={{ color: "var(--text-secondary)" }}>Name: </span><strong>{selectedStudent.user ? `${selectedStudent.user.firstName} ${selectedStudent.user.lastName}` : selectedStudent.parentName}</strong></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Batch: </span><strong>{selectedStudent.enrollments?.[0]?.batch?.name || "—"}</strong></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Email: </span><strong>{selectedStudent.user?.email || "—"}</strong></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Status: </span><strong style={{ color: "var(--color-success)" }}>ACTIVE</strong></div>
              </div>

              {/* Enrollment Details */}
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-glass)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Parent/Guardian</span>
                  <span style={{ fontWeight: 700 }}>{selectedStudent.parentName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-glass)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Parent Phone</span>
                  <span style={{ fontWeight: 700 }}>{selectedStudent.parentPhone}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-glass)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Date of Birth</span>
                  <span style={{ fontWeight: 700 }}>{new Date(selectedStudent.dateOfBirth).toLocaleDateString("en-IN")}</span>
                </div>
              </div>

              {/* Print Button */}
              <Button
                onClick={() => window.print()}
                variant="primary"
                leftIcon={<Download size={14} />}
                style={{ width: "100%" }}
              >
                Download Report Card
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <FileText size={36} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "12px" }} />
              <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
                Select any student from the ledger to generate & preview their official printable report card.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
