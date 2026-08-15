import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Award, BookOpen, TrendingUp, Users2, Download } from "lucide-react";
import { Button } from "./ui/Button";

const LS_KEY = "ecrm_marksheets"; // kept for migration fallback

interface MarkEntry {
  studentId: string;
  studentName: string;
  subject: string;
  marks: number;
  totalMarks: number;
  examTitle: string;
  batch: string;
}

export function MarksheetSystem() {
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ studentId: "", subject: "", marks: "", totalMarks: "100", examTitle: "" });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedBatch) loadMarksheets(); }, [selectedBatch]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stuRes, batRes] = await Promise.all([api.students.getAll(), api.batches.getAll()]);
      if (stuRes.data) setStudents(stuRes.data);
      if (batRes.data) {
        setBatches(batRes.data);
        if (batRes.data.length > 0 && !selectedBatch) setSelectedBatch(batRes.data[0].name);
      }
    } catch {}
    setIsLoading(false);
  };

  const loadMarksheets = async () => {
    try {
      const res = await api.marksheets.getAll({ batch: selectedBatch });
      if (res.data) {
        setEntries(res.data.map((e: any) => ({
          studentId: e.studentId,
          studentName: e.studentName,
          subject: e.subject,
          marks: e.marks,
          totalMarks: e.totalMarks,
          examTitle: e.examTitle,
          batch: e.batch,
        })));
      }
    } catch {
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setEntries(JSON.parse(saved).filter((e: any) => e.batch === selectedBatch));
    }
  };

  const handleAdd = async () => {
    if (!form.studentId || !form.subject || !form.marks || !form.examTitle) return;
    const student = students.find(s => s.id === form.studentId);
    const name = student?.user ? `${student.user.firstName} ${student.user.lastName}` : "Student";
    try {
      await api.marksheets.create({
        studentId: form.studentId,
        studentName: name,
        subject: form.subject,
        marks: Number(form.marks),
        totalMarks: Number(form.totalMarks) || 100,
        examTitle: form.examTitle,
        batch: selectedBatch,
      });
      setForm({ studentId: "", subject: "", marks: "", totalMarks: "100", examTitle: "" });
      setShowAdd(false);
      loadMarksheets();
    } catch (err: any) {
      alert(err.message || "Failed to save marks");
    }
  };

  const batchEntries = entries.filter(e => e.batch === selectedBatch);

  // Student-wise aggregation
  const studentMap = new Map<string, { name: string; subjects: { subject: string; marks: number; total: number; exam: string }[] }>();
  batchEntries.forEach(e => {
    if (!studentMap.has(e.studentId)) studentMap.set(e.studentId, { name: e.studentName, subjects: [] });
    studentMap.get(e.studentId)!.subjects.push({ subject: e.subject, marks: e.marks, total: e.totalMarks, exam: e.examTitle });
  });

  const studentResults = Array.from(studentMap.entries()).map(([id, data]) => {
    const totalObtained = data.subjects.reduce((s, sub) => s + sub.marks, 0);
    const totalMax = data.subjects.reduce((s, sub) => s + sub.total, 0);
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : percentage >= 35 ? "D" : "F";
    return { id, ...data, totalObtained, totalMax, percentage, grade };
  }).sort((a, b) => b.percentage - a.percentage);

  const batchStudents = students.filter(s => s.enrollments?.some((e: any) => e.batch?.name === selectedBatch));

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Marksheet & Results</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Subject-wise marks, grades, percentage, and rank.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)} leftIcon={<Award size={14} />}>Add Marks</Button>
      </div>

      {/* Batch Selector */}
      <div style={{ marginBottom: "20px" }}>
        <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", fontWeight: 600, outline: "none", background: "#fff", cursor: "pointer" }}>
          {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
      </div>

      {/* Results Table */}
      {studentResults.length === 0 ? (
        <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
          <BookOpen size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No marks entered for this batch yet.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "rgba(29,10,39,0.02)", borderBottom: "1px solid var(--border-glass)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Rank</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Student</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Subjects</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Total</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>%</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((sr, rank) => (
                  <tr key={sr.id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: rank < 3 ? "hsl(38,92%,50%)" : "var(--text-secondary)" }}>#{rank + 1}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{sr.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {sr.subjects.map((sub, i) => (
                          <span key={i} style={{ fontSize: "10px", fontWeight: 600, background: sub.marks >= sub.total * 0.35 ? "hsla(142,70%,42%,0.08)" : "hsla(342,90%,48%,0.08)", color: sub.marks >= sub.total * 0.35 ? "var(--color-success)" : "var(--color-danger)", padding: "2px 8px", borderRadius: "8px" }}>
                            {sub.subject}: {sub.marks}/{sub.total}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>{sr.totalObtained}/{sr.totalMax}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: sr.percentage >= 60 ? "var(--color-success)" : sr.percentage >= 35 ? "hsl(38,92%,50%)" : "var(--color-danger)" }}>{sr.percentage.toFixed(1)}%</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "10px", background: sr.grade === "F" ? "hsla(342,90%,48%,0.1)" : "hsla(142,70%,42%,0.1)", color: sr.grade === "F" ? "var(--color-danger)" : "var(--color-success)" }}>{sr.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Marks Modal */}
      {showAdd && (
        <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Add Marks</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Student *</label>
                <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", background: "#fff", cursor: "pointer", boxSizing: "border-box" }}>
                  <option value="">Select student...</option>
                  {batchStudents.map(s => <option key={s.id} value={s.id}>{s.user ? `${s.user.firstName} ${s.user.lastName}` : s.parentName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Exam Title *</label>
                <input value={form.examTitle} onChange={(e) => setForm({ ...form, examTitle: e.target.value })} placeholder="e.g. Mid Term 2026"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Subject *</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Maths"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Marks *</label>
                  <input value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} placeholder="75"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Out of</label>
                  <input value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} placeholder="100"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAdd}>Save Marks</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
