import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  BookOpen, Plus, Trash2, Search, Layers, GraduationCap,
  Calendar, Users2, ArrowUpRight,
} from "lucide-react";

export function AcademicManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", code: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subRes, batchRes] = await Promise.all([
        api.subjects.getAll(),
        api.batches.getAll(),
      ]);
      if (subRes.data) setSubjects(subRes.data);
      if (batchRes.data) setBatches(batchRes.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name.trim()) return;
    setCreating(true);
    try {
      await api.subjects.create(newSubject);
      setNewSubject({ name: "", code: "", description: "" });
      setShowAddSubject(false);
      loadData();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    try { await api.subjects.delete(id); loadData(); } catch (err) { console.error(err); }
  };

  
  

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Academic Management</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Manage subjects, courses, and batch configuration.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddSubject(true)} leftIcon={<Plus size={14} />}>Add Subject</Button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Subjects", value: subjects.length, icon: <BookOpen size={18} />, color: "hsl(271,91%,60%)" },
          { label: "Active Batches", value: batches.length, icon: <Layers size={18} />, color: "hsl(328,100%,54%)" },
          { label: "Total Capacity", value: batches.reduce((s, b) => s + (b.capacity || 0), 0), icon: <Users2 size={18} />, color: "hsl(142,70%,42%)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two column: Subjects + Batches */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Subjects */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Subjects</h3>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "hsl(271,91%,60%)", background: "hsla(271,91%,60%,0.08)", padding: "3px 10px", borderRadius: "12px" }}>{subjects.length}</span>
          </div>
          {isLoading ? (
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1,2,3].map(i => <Skeleton key={i} variant="rect" height={48} />)}
            </div>
          ) : subjects.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <BookOpen size={28} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>No subjects yet. Add one to get started.</p>
            </div>
          ) : (
            subjects.map((sub) => (
              <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border-glass)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "hsla(271,91%,60%,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={14} style={{ color: "hsl(271,91%,60%)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{sub.name}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{sub.code || "—"} · {sub._count?.homework || 0} assignments</p>
                </div>
                <button onClick={() => handleDeleteSubject(sub.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", opacity: 0.5 }}><Trash2 size={14} /></button>
              </div>
            ))
          )}
        </div>

        {/* Batches */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Active Batches</h3>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "hsl(328,100%,54%)", background: "hsla(328,100%,54%,0.08)", padding: "3px 10px", borderRadius: "12px" }}>{batches.length}</span>
          </div>
          {isLoading ? (
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1,2,3].map(i => <Skeleton key={i} variant="rect" height={48} />)}
            </div>
          ) : batches.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <GraduationCap size={28} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>No batches configured yet.</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border-glass)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "hsla(328,100%,54%,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GraduationCap size={14} style={{ color: "hsl(328,100%,54%)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{batch.name}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{batch.subject} · Cap: {batch.capacity}</p>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,42%,0.08)", padding: "3px 8px", borderRadius: "10px" }}>₹{Number(batch.feeAmount).toLocaleString("en-IN")}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowAddSubject(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Add Subject</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={labelStyle}>Subject Name *</label><input style={inputStyle} value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="e.g. Mathematics" /></div>
              <div><label style={labelStyle}>Code</label><input style={inputStyle} value={newSubject.code} onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })} placeholder="e.g. MATH" /></div>
              <div><label style={labelStyle}>Description</label><input style={inputStyle} value={newSubject.description} onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })} placeholder="Optional description" /></div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowAddSubject(false)}>Cancel</Button>
              <Button variant="primary" isLoading={creating} onClick={handleCreateSubject} leftIcon={<Plus size={14} />}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
