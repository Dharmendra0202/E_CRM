import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  FileText, Plus, Search, Calendar, Clock, CheckCircle2,
  XCircle, Users2, BookOpen, Filter, AlertCircle, TrendingUp,
} from "lucide-react";

export function HomeworkAssignments() {
  const [homework, setHomework] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newHw, setNewHw] = useState({ title: "", description: "", subjectId: "", batchId: "", dueDate: "", maxScore: "" });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadHomework(); }, [filterBatch, filterStatus]);

  const loadData = async () => {
    try {
      const [batchRes, subRes, statsRes] = await Promise.all([
        api.batches.getAll(),
        api.subjects.getAll(),
        api.homework.getStats(),
      ]);
      if (batchRes.data) setBatches(batchRes.data);
      if (subRes.data) setSubjects(subRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) { console.error(err); }
  };

  const loadHomework = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterBatch) params.batch_id = filterBatch;
      if (filterStatus) params.status = filterStatus;
      const res = await api.homework.getAll(params);
      if (res.data) setHomework(res.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newHw.title || !newHw.dueDate) return;
    setCreating(true);
    try {
      await api.homework.create({
        title: newHw.title,
        description: newHw.description || null,
        subjectId: newHw.subjectId || null,
        batchId: newHw.batchId || null,
        dueDate: newHw.dueDate,
        maxScore: newHw.maxScore || null,
      });
      setNewHw({ title: "", description: "", subjectId: "", batchId: "", dueDate: "", maxScore: "" });
      setShowCreate(false);
      loadHomework();
      loadData();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this homework?")) return;
    try { await api.homework.delete(id); loadHomework(); loadData(); } catch (err) { console.error(err); }
  };

  const handleCloseHomework = async (id: string) => {
    try { await api.homework.update(id, { status: "CLOSED" }); loadHomework(); loadData(); } catch (err) { console.error(err); }
  };

  
  

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Homework & Assignments</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Create, track, and grade student assignments.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus size={14} />}>New Assignment</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total", value: stats.total, color: "hsl(271,91%,60%)" },
            { label: "Active", value: stats.active, color: "hsl(328,100%,54%)" },
            { label: "Overdue", value: stats.overdue, color: "var(--color-danger)" },
            { label: "Submissions", value: stats.totalSubmissions, color: "hsl(142,70%,42%)" },
            { label: "Pending Grading", value: stats.pendingGrading, color: "hsl(38,92%,50%)" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid var(--border-glass)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <select style={{ ...inputStyle, width: "200px" }} value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "160px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Homework List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {isLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={80} />)
        ) : homework.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
            <FileText size={36} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "12px" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>No homework found. Create your first assignment.</p>
          </div>
        ) : (
          homework.map((hw) => {
            const isOverdue = hw.status === "ACTIVE" && new Date(hw.dueDate) < new Date();
            const statusColor = hw.status === "ACTIVE" ? (isOverdue ? "var(--color-danger)" : "var(--color-success)") : "var(--text-secondary)";
            return (
              <div key={hw.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", border: `1px solid ${isOverdue ? "hsla(342,90%,48%,0.2)" : "var(--border-glass)"}`, display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: `${statusColor}12`, display: "flex", alignItems: "center", justifyContent: "center", color: statusColor, flexShrink: 0 }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{hw.title}</p>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: statusColor, background: `${statusColor}12`, padding: "2px 8px", borderRadius: "10px" }}>
                      {isOverdue ? "OVERDUE" : hw.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                    {hw.subject?.name || "No subject"} · Due: {new Date(hw.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {hw.maxScore && ` · Max: ${hw.maxScore} marks`}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "hsl(271,91%,60%)" }}>{hw.submissionCount}</p>
                    <p style={{ margin: 0, fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Submitted</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--color-success)" }}>{hw.gradedCount}</p>
                    <p style={{ margin: 0, fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Graded</p>
                  </div>
                  {hw.status === "ACTIVE" && (
                    <button onClick={() => handleCloseHomework(hw.id)} title="Close assignment" style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>New Assignment</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Title *</label><input style={inputStyle} value={newHw.title} onChange={(e) => setNewHw({ ...newHw, title: e.target.value })} placeholder="Assignment title" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description</label><input style={inputStyle} value={newHw.description} onChange={(e) => setNewHw({ ...newHw, description: e.target.value })} placeholder="Instructions..." /></div>
              <div>
                <label style={labelStyle}>Subject</label>
                <select style={inputStyle} value={newHw.subjectId} onChange={(e) => setNewHw({ ...newHw, subjectId: e.target.value })}>
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Batch</label>
                <select style={inputStyle} value={newHw.batchId} onChange={(e) => setNewHw({ ...newHw, batchId: e.target.value })}>
                  <option value="">Select batch</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Due Date *</label><input style={inputStyle} type="date" value={newHw.dueDate} onChange={(e) => setNewHw({ ...newHw, dueDate: e.target.value })} /></div>
              <div><label style={labelStyle}>Max Score</label><input style={inputStyle} type="number" value={newHw.maxScore} onChange={(e) => setNewHw({ ...newHw, maxScore: e.target.value })} placeholder="e.g. 100" /></div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" isLoading={creating} onClick={handleCreate} leftIcon={<Plus size={14} />}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
