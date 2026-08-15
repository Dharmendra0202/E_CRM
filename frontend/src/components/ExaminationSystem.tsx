import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { api } from "../utils/api";
import {
  Plus, BookOpen, Calendar, CheckCircle2, Clock, Edit, Trash2,
  FileText, Users2, Award,
} from "lucide-react";

type ExamStatus = "DRAFT" | "SCHEDULED" | "CONDUCTED" | "EVALUATED" | "PUBLISHED";

interface Exam {
  id: string;
  title: string;
  type: string;
  subject: string;
  batch: string;
  date: string;
  totalMarks: number;
  passingMarks: number;
  status: ExamStatus;
  createdAt: string;
}

const EXAM_TYPES = ["Unit Test", "Mid Term", "Prelims", "Final Exam", "Practice Test", "Quiz", "Assignment"];
const STATUS_FLOW: ExamStatus[] = ["DRAFT", "SCHEDULED", "CONDUCTED", "EVALUATED", "PUBLISHED"];
const STATUS_COLORS: Record<ExamStatus, string> = {
  DRAFT: "hsl(200,95%,50%)",
  SCHEDULED: "hsl(271,91%,60%)",
  CONDUCTED: "hsl(38,92%,50%)",
  EVALUATED: "hsl(328,100%,54%)",
  PUBLISHED: "hsl(142,70%,42%)",
};

const LS_KEY = "ecrm_exams";

export function ExaminationSystem() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [form, setForm] = useState({
    title: "", type: EXAM_TYPES[0], subject: "", batch: "", date: "",
    totalMarks: "100", passingMarks: "35",
  });

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setExams(JSON.parse(saved));
    loadBatches();
  }, []);

  const save = (list: Exam[]) => { setExams(list); localStorage.setItem(LS_KEY, JSON.stringify(list)); };

  const loadBatches = async () => {
    try { const res = await api.batches.getAll(); if (res.data) setBatches(res.data); } catch {}
  };

  const handleCreate = () => {
    if (!form.title || !form.subject || !form.batch || !form.date) return;
    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      title: form.title,
      type: form.type,
      subject: form.subject,
      batch: form.batch,
      date: form.date,
      totalMarks: Number(form.totalMarks) || 100,
      passingMarks: Number(form.passingMarks) || 35,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };
    save([newExam, ...exams]);
    setForm({ title: "", type: EXAM_TYPES[0], subject: "", batch: "", date: "", totalMarks: "100", passingMarks: "35" });
    setShowCreate(false);
  };

  const advanceStatus = (id: string) => {
    save(exams.map(e => {
      if (e.id !== id) return e;
      const idx = STATUS_FLOW.indexOf(e.status);
      if (idx < STATUS_FLOW.length - 1) return { ...e, status: STATUS_FLOW[idx + 1] };
      return e;
    }));
  };

  const deleteExam = (id: string) => {
    if (confirm("Delete this exam?")) save(exams.filter(e => e.id !== id));
  };

  const filtered = filterStatus ? exams.filter(e => e.status === filterStatus) : exams;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Examination System</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Create exams, manage lifecycle, configure marks.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus size={14} />}>Create Exam</Button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {STATUS_FLOW.map(s => (
          <div key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            style={{ padding: "12px", borderRadius: "12px", background: filterStatus === s ? `${STATUS_COLORS[s]}12` : "#fff", border: `1.5px solid ${filterStatus === s ? STATUS_COLORS[s] : "var(--border-glass)"}`, cursor: "pointer", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800, color: STATUS_COLORS[s] }}>{exams.filter(e => e.status === s).length}</p>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s}</p>
          </div>
        ))}
      </div>

      {/* Exams List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
            <BookOpen size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No exams{filterStatus ? ` with status "${filterStatus}"` : ""}. Create one to get started.</p>
          </div>
        ) : filtered.map(exam => (
          <div key={exam.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: `${STATUS_COLORS[exam.status]}12`, display: "flex", alignItems: "center", justifyContent: "center", color: STATUS_COLORS[exam.status], flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{exam.title}</p>
                <span style={{ fontSize: "9px", fontWeight: 700, color: STATUS_COLORS[exam.status], background: `${STATUS_COLORS[exam.status]}12`, padding: "2px 8px", borderRadius: "10px" }}>{exam.status}</span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                {exam.type} · {exam.subject} · {exam.batch} · {new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {exam.totalMarks} marks (Pass: {exam.passingMarks})
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              {exam.status !== "PUBLISHED" && (
                <button onClick={() => advanceStatus(exam.id)} title={`Move to ${STATUS_FLOW[STATUS_FLOW.indexOf(exam.status) + 1]}`}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: `${STATUS_COLORS[exam.status]}12`, color: STATUS_COLORS[exam.status], fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                  Next →
                </button>
              )}
              <button onClick={() => deleteExam(exam.id)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "hsla(342,90%,48%,0.08)", color: "var(--color-danger)", cursor: "pointer" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Exam Modal */}
      {showCreate && (
        <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Create New Exam</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Exam Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid Term Examination 2026"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Exam Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", background: "#fff", cursor: "pointer", boxSizing: "border-box" }}>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Subject *</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Batch / Class *</label>
                  <select value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", background: "#fff", cursor: "pointer", boxSizing: "border-box" }}>
                    <option value="">Select batch...</option>
                    {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Exam Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Total Marks</label>
                  <input value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} placeholder="100"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Passing Marks</label>
                  <input value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} placeholder="35"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} leftIcon={<Plus size={14} />}>Create Exam</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
