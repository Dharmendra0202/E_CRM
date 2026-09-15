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

const EXAM_TYPES = ["Test", "Preliminary", "Extra Test", "Activity", "Unit Test", "Final Exam", "Quiz", "Assignment"];
const STATUS_FLOW: ExamStatus[] = ["DRAFT", "SCHEDULED", "CONDUCTED", "EVALUATED", "PUBLISHED"];
const STATUS_COLORS: Record<ExamStatus, string> = {
  DRAFT: "hsl(200,95%,50%)",
  SCHEDULED: "hsl(271,91%,60%)",
  CONDUCTED: "hsl(38,92%,50%)",
  EVALUATED: "hsl(328,100%,54%)",
  PUBLISHED: "hsl(142,70%,42%)",
};

const LS_KEY = "ecrm_exams"; // kept for migration fallback

export function ExaminationSystem({ userRole = "ADMIN" }: { userRole?: string }) {
  const isStudent = userRole === "STUDENT" || userRole === "PARENT";
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    title: "", type: EXAM_TYPES[0], subject: "", batch: "", date: "",
    totalMarks: "100", passingMarks: "35",
  });

  // Marks entry modal (admin)
  const [marksExam, setMarksExam] = useState<Exam | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [examRes, batchRes] = await Promise.all([
        api.exams2.getAll(),
        api.batches.getAll(),
      ]);
      if (examRes.data) {
        setExams(examRes.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          subject: e.subject,
          batch: e.batchName || "",
          date: e.date?.split("T")[0] || "",
          totalMarks: e.totalMarks,
          passingMarks: e.passingMarks,
          status: e.status,
          createdAt: e.createdAt,
        })));
      }
      if (batchRes.data) setBatches(batchRes.data);
    } catch {
      // Fallback to localStorage if API fails (offline mode)
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setExams(JSON.parse(saved));
    }
    setIsLoading(false);
  };

  const loadBatches = async () => {
    try { const res = await api.batches.getAll(); if (res.data) setBatches(res.data); } catch {}
  };

  const handleCreate = async () => {
    if (!form.title || !form.subject || !form.batch || !form.date) return;
    try {
      const selectedBatch = batches.find((b) => b.name === form.batch);
      await api.exams2.create({
        title: form.title,
        type: form.type,
        subject: form.subject,
        batchId: selectedBatch?.id,
        batchName: form.batch,
        date: form.date,
        totalMarks: Number(form.totalMarks) || 100,
        passingMarks: Number(form.passingMarks) || 35,
      });
      setForm({ title: "", type: EXAM_TYPES[0], subject: "", batch: "", date: "", totalMarks: "100", passingMarks: "35" });
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create exam");
    }
  };

  const advanceStatus = async (id: string) => {
    const exam = exams.find(e => e.id === id);
    if (!exam) return;
    const idx = STATUS_FLOW.indexOf(exam.status);
    if (idx >= STATUS_FLOW.length - 1) return;
    try {
      await api.exams2.update(id, { status: STATUS_FLOW[idx + 1] });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    try {
      await api.exams2.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete exam");
    }
  };

  const filtered = filterStatus ? exams.filter(e => e.status === filterStatus) : exams;

  // ── STUDENT / PARENT read-only view: upcoming & scheduled exams ──
  if (isStudent) {
    const upcoming = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (
      <div className="animate-fade-in" style={{ fontFamily: '"Lucida Grande", Helvetica, Arial, Verdana, sans-serif' }}>
        <div style={{ marginBottom: "18px" }}>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>My Examinations</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Your scheduled exams and tests.</p>
        </div>
        {isLoading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>Loading exams...</div>
        ) : upcoming.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
            <BookOpen size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No exams scheduled yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {upcoming.map((exam) => (
              <div key={exam.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: `${STATUS_COLORS[exam.status]}12`, display: "flex", alignItems: "center", justifyContent: "center", color: STATUS_COLORS[exam.status], flexShrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700 }}>{exam.title}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                    {exam.type} · {exam.subject} · {new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {exam.totalMarks} marks
                  </p>
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, color: STATUS_COLORS[exam.status], background: `${STATUS_COLORS[exam.status]}12`, padding: "3px 10px", borderRadius: "10px" }}>{exam.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "20px" }}>
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
              <button onClick={() => setMarksExam(exam)} title="Enter marks"
                style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "hsla(271,91%,60%,0.1)", color: "hsl(271,91%,50%)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                Enter Marks
              </button>
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

      {/* Enter Marks Modal */}
      {marksExam && (
        <MarksEntryModal exam={marksExam} onClose={() => setMarksExam(null)} />
      )}

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

// ═══════════════ Marks Entry Modal (admin/teacher) ═══════════════
function MarksEntryModal({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [stuRes, examRes] = await Promise.all([
          api.students.getAll(),
          api.exams2.getAll({ batch_id: undefined }),
        ]);
        const all = stuRes.data || [];
        // Filter students enrolled in this exam's batch (by name)
        const inBatch = exam.batch
          ? all.filter((s: any) => s.enrollments?.some((e: any) => e.batch?.name === exam.batch))
          : all;
        setStudents(inBatch.length ? inBatch : all);

        // Prefill existing results
        const thisExam = (examRes.data || []).find((e: any) => e.id === exam.id);
        const existing: Record<string, string> = {};
        for (const r of thisExam?.results || []) existing[r.studentId] = String(r.marks);
        setMarks(existing);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [exam.id]);

  const studentName = (s: any) => s.user ? `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() : "Student";

  const saveAll = async (publish: boolean) => {
    setSaving(true);
    setMsg("");
    try {
      const entries = Object.entries(marks).filter(([, v]) => v !== "" && !isNaN(Number(v)));
      for (const [studentId, v] of entries) {
        const m = Number(v);
        const pct = exam.totalMarks > 0 ? (m / exam.totalMarks) * 100 : 0;
        const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 35 ? "D" : "F";
        await api.exams2.addResult(exam.id, { studentId, marks: m, grade });
      }
      if (publish) {
        await api.exams2.update(exam.id, { status: "PUBLISHED" });
      }
      setMsg(publish ? "Marks saved & published. Students notified." : "Marks saved.");
      if (publish) setTimeout(onClose, 900);
    } catch (e: any) {
      setMsg(e?.message || "Failed to save marks.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "26px", width: "100%", maxWidth: "560px", maxHeight: "85vh", overflowY: "auto" }} className="animate-slide-up">
        <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>Enter Marks — {exam.title}</h3>
        <p style={{ margin: "0 0 18px", fontSize: "12px", color: "var(--text-secondary)" }}>
          {exam.subject} · {exam.batch || "All"} · Total {exam.totalMarks} marks
        </p>

        {msg && <div style={{ background: "hsla(142,70%,42%,0.1)", color: "hsl(142,70%,32%)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>{msg}</div>}

        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>No students found for this batch.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {students.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "8px 12px", background: "#f7f8fc", borderRadius: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#3a3f45" }}>{studentName(s)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="number"
                    value={marks[s.id] ?? ""}
                    onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                    placeholder="0"
                    min="0"
                    max={exam.totalMarks}
                    style={{ width: "70px", padding: "7px 10px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "13px", outline: "none", textAlign: "center" }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>/ {exam.totalMarks}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => saveAll(false)} disabled={saving}>Save Draft</Button>
          <Button variant="primary" onClick={() => saveAll(true)} disabled={saving}>Save & Publish</Button>
        </div>
      </div>
    </div>
  );
}
