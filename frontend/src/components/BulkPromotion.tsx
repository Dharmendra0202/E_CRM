import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { api } from "../utils/api";
import { ArrowUpRight, CheckCircle2, XCircle, Users2, GraduationCap } from "lucide-react";

export function BulkPromotion() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromBatch, setFromBatch] = useState("");
  const [toBatch, setToBatch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState<{ promoted: number; skipped: number } | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stuRes, batRes] = await Promise.all([api.students.getAll(), api.batches.getAll()]);
      if (stuRes.data) setStudents(stuRes.data);
      if (batRes.data) setBatches(batRes.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const filteredStudents = fromBatch
    ? students.filter(s => s.enrollments?.some((e: any) => e.batch?.name === fromBatch && e.status === "ACTIVE"))
    : [];

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudents);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedStudents(next);
  };

  const selectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handlePromote = async () => {
    if (!toBatch || selectedStudents.size === 0) return;
    setPromoting(true);
    let promoted = 0;
    let skipped = 0;

    const targetBatch = batches.find(b => b.name === toBatch);
    if (!targetBatch) { alert("Target batch not found"); setPromoting(false); return; }

    for (const studentId of selectedStudents) {
      try {
        await api.batches.enroll(targetBatch.id, studentId);
        promoted++;
      } catch {
        skipped++;
      }
    }

    setResult({ promoted, skipped });
    setSelectedStudents(new Set());
    setPromoting(false);
    loadData();
  };

  const batchNames = [...new Set(batches.map(b => b.name))];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Bulk Promotion</h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Promote students from one class/batch to another in bulk.</p>
      </div>

      {/* Result Banner */}
      {result && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", background: "hsla(142,70%,42%,0.08)", border: "1px solid hsla(142,70%,42%,0.2)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />
          <span style={{ fontSize: "13px", fontWeight: 600 }}>
            <strong>{result.promoted}</strong> student{result.promoted !== 1 ? "s" : ""} promoted successfully. {result.skipped > 0 && <><strong>{result.skipped}</strong> skipped (already enrolled or error).</>}
          </span>
          <button onClick={() => setResult(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><XCircle size={16} /></button>
        </div>
      )}

      {/* From/To Batch Selection */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "16px", alignItems: "end", marginBottom: "24px", background: "#fff", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "hsl(285,50%,12%)", marginBottom: "6px", display: "block" }}>From Class / Batch</label>
          <select value={fromBatch} onChange={(e) => { setFromBatch(e.target.value); setSelectedStudents(new Set()); }}
            style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", fontWeight: 600, outline: "none", background: "#fff", cursor: "pointer" }}>
            <option value="">Select source batch...</option>
            {batchNames.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingBottom: "8px" }}>
          <ArrowUpRight size={24} style={{ color: "hsl(200, 85%, 48%)" }} />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "hsl(285,50%,12%)", marginBottom: "6px", display: "block" }}>To Class / Batch (Promote To)</label>
          <select value={toBatch} onChange={(e) => setToBatch(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", fontWeight: 600, outline: "none", background: "#fff", cursor: "pointer" }}>
            <option value="">Select target batch...</option>
            {batchNames.filter(b => b !== fromBatch).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Student List */}
      {fromBatch && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>
              <GraduationCap size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
              {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} in {fromBatch}
            </span>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button onClick={selectAll} style={{ fontSize: "11px", fontWeight: 700, color: "hsl(200, 85%, 48%)", background: "hsla(200, 85%, 48%,0.08)", border: "1px solid hsla(200, 85%, 48%,0.2)", padding: "5px 12px", borderRadius: "8px", cursor: "pointer" }}>
                {selectedStudents.size === filteredStudents.length ? "Deselect All" : "Select All"}
              </button>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>{selectedStudents.size} selected</span>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <Users2 size={28} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No active students in this batch.</p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : s.parentName;
              const checked = selectedStudents.has(s.id);
              return (
                <div key={s.id} onClick={() => toggleStudent(s.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border-glass)", cursor: "pointer", background: checked ? "hsla(200, 85%, 48%,0.04)" : "transparent" }}>
                  <input type="checkbox" checked={checked} onChange={() => {}} style={{ width: "16px", height: "16px", accentColor: "hsl(200, 85%, 48%)" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{name}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{s.user?.email || s.parentEmail}</p>
                  </div>
                </div>
              );
            })
          )}

          {/* Promote Button */}
          {selectedStudents.size > 0 && toBatch && (
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" isLoading={promoting} onClick={handlePromote}>
                Promote {selectedStudents.size} Student{selectedStudents.size !== 1 ? "s" : ""} to {toBatch}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
