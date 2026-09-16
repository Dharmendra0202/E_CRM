import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { AlertCircle, TrendingDown, BookOpen, CheckCircle2, Target, Award } from "lucide-react";

const LS_MARKS_KEY = "ecrm_marksheets";

export function WeakStudentModule() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stuRes, batRes] = await Promise.all([api.students.getAll(), api.batches.getAll()]);
      if (stuRes.data) setStudents(stuRes.data);
      if (batRes.data) { setBatches(batRes.data); if (batRes.data.length > 0 && !selectedBatch) setSelectedBatch(batRes.data[0].name); }
    } catch {}
    setIsLoading(false);
  };

  // Get marks from localStorage (shared with MarksheetSystem)
  const allMarks = (() => {
    try { return JSON.parse(localStorage.getItem(LS_MARKS_KEY) || "[]"); } catch { return []; }
  })();

  const batchStudents = students.filter(s => s.enrollments?.some((e: any) => e.batch?.name === selectedBatch));

  // Identify weak students (below 40% average)
  const weakStudents = batchStudents.map(s => {
    const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : s.parentName;
    const marks = allMarks.filter((m: any) => m.studentId === s.id);
    if (marks.length === 0) return null;
    const totalObtained = marks.reduce((sum: number, m: any) => sum + m.marks, 0);
    const totalMax = marks.reduce((sum: number, m: any) => sum + m.totalMarks, 0);
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    if (percentage >= 40) return null; // Not weak
    return { id: s.id, name, email: s.user?.email || "", marks, totalObtained, totalMax, percentage };
  }).filter(Boolean) as any[];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Weak Student Improvement</h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Auto-identify students scoring below 40% and track their improvement.</p>
      </div>

      {/* Batch Selector */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
        <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", fontWeight: 600, outline: "none", background: "#fff", cursor: "pointer" }}>
          {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
          {weakStudents.length} weak student{weakStudents.length !== 1 ? "s" : ""} identified
        </span>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "hsla(205, 85%, 50%,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)" }}><TrendingDown size={20} /></div>
          <div>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Below 40%</p>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--color-danger)" }}>{weakStudents.length}</p>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0,123,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0069d9" }}><Target size={20} /></div>
          <div>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Total in Batch</p>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0069d9" }}>{batchStudents.length}</p>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "hsla(142,70%,42%,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-success)" }}><CheckCircle2 size={20} /></div>
          <div>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Above 40%</p>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--color-success)" }}>{batchStudents.length - weakStudents.length}</p>
          </div>
        </div>
      </div>

      {/* Weak Students List */}
      {weakStudents.length === 0 ? (
        <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
          <Award size={32} style={{ color: "var(--color-success)", opacity: 0.5, marginBottom: "10px" }} />
          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>All students are performing well!</p>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>No students below 40% threshold in this batch. {allMarks.length === 0 && "Add marks in the Marksheet section first."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {weakStudents.map(ws => (
            <div key={ws.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", border: "1px solid hsla(205, 85%, 50%,0.12)", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "hsla(205, 85%, 50%,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>
                {ws.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700 }}>{ws.name}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {ws.marks.map((m: any, i: number) => (
                    <span key={i} style={{ fontSize: "10px", fontWeight: 600, background: "hsla(205, 85%, 50%,0.08)", color: "var(--color-danger)", padding: "2px 8px", borderRadius: "8px" }}>
                      {m.subject}: {m.marks}/{m.totalMarks}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--color-danger)" }}>{ws.percentage.toFixed(1)}%</p>
                <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>{ws.totalObtained}/{ws.totalMax}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Improvement Resources (Placeholder) */}
      <div style={{ marginTop: "24px", background: "rgba(0,123,255,0.04)", borderRadius: "14px", padding: "20px", border: "1px solid rgba(0,123,255,0.1)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <BookOpen size={16} style={{ color: "#0069d9" }} /> Improvement Resources
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-secondary)" }}>Coming soon: MCQs, practice tests, one-word answers, and match-the-column exercises for weak students.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
          {["MCQ Practice", "One-Word Answers", "Match the Columns", "Practice Tests"].map(item => (
            <div key={item} style={{ padding: "12px", borderRadius: "10px", background: "#fff", border: "1px solid rgba(0,123,255,0.12)", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#0069d9" }}>{item}</p>
              <p style={{ margin: "4px 0 0", fontSize: "10px", color: "var(--text-secondary)" }}>Coming Soon</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
