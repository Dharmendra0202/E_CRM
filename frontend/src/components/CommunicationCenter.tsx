import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  Bell, Plus, Search, Trash2, Megaphone, AlertCircle,
  Users2, Clock, CheckCircle2,
} from "lucide-react";

const TYPES = ["GENERAL", "ACADEMIC", "EVENT", "HOLIDAY", "EMERGENCY", "FEE_REMINDER"];
const AUDIENCES = ["ALL", "STUDENTS", "PARENTS", "TEACHERS", "STAFF"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function CommunicationCenter() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAnn, setNewAnn] = useState({
    title: "", content: "", type: "GENERAL",
    audience: "ALL", priority: "NORMAL",
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.announcements.getAll();
      if (res.data) setAnnouncements(res.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newAnn.title || !newAnn.content) return;
    setCreating(true);
    try {
      await api.announcements.create(newAnn);
      setNewAnn({ title: "", content: "", type: "GENERAL", audience: "ALL", priority: "NORMAL" });
      setShowCreate(false);
      loadData();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try { await api.announcements.delete(id); loadData(); } catch (err) { console.error(err); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try { await api.announcements.update(id, { isActive: !isActive }); loadData(); } catch (err) { console.error(err); }
  };

  const priorityColors: Record<string, string> = {
    LOW: "var(--text-secondary)", NORMAL: "hsl(200,95%,50%)",
    HIGH: "hsl(38,92%,50%)", URGENT: "var(--color-danger)",
  };

  const typeIcons: Record<string, string> = {
    GENERAL: "📢", ACADEMIC: "📚", EVENT: "🎉",
    HOLIDAY: "🏖️", EMERGENCY: "🚨", FEE_REMINDER: "💰",
  };

  
  

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Communication Center</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
            Send announcements, notices, and alerts to your community.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus size={14} />}>
          New Announcement
        </Button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total", value: announcements.length, color: "hsl(271,91%,60%)" },
          { label: "Active", value: announcements.filter((a) => a.isActive).length, color: "var(--color-success)" },
          { label: "Urgent", value: announcements.filter((a) => a.priority === "URGENT").length, color: "var(--color-danger)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid var(--border-glass)" }}>
            <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={80} />)}
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: "60px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
          <Megaphone size={36} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>No announcements yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {announcements.map((ann) => {
            const pColor = priorityColors[ann.priority] || "var(--text-secondary)";
            return (
              <div key={ann.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", border: `1px solid ${ann.isActive ? "var(--border-glass)" : "hsla(342,90%,48%,0.15)"}`, opacity: ann.isActive ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "20px", flexShrink: 0 }}>{typeIcons[ann.type] || "📢"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{ann.title}</p>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: pColor, background: `${pColor}12`, padding: "2px 7px", borderRadius: "8px", textTransform: "uppercase" }}>{ann.priority}</span>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "hsl(200,95%,50%)", background: "hsla(200,95%,50%,0.08)", padding: "2px 7px", borderRadius: "8px" }}>{ann.audience}</span>
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{ann.content.substring(0, 150)}{ann.content.length > 150 ? "..." : ""}</p>
                    <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>
                      {new Date(ann.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => handleToggle(ann.id, ann.isActive)} title={ann.isActive ? "Deactivate" : "Activate"} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: ann.isActive ? "var(--color-success)" : "var(--text-secondary)" }}>
                      {ann.isActive ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    </button>
                    <button onClick={() => handleDelete(ann.id)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)", opacity: 0.6 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>New Announcement</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Title *</label><input style={inputStyle} value={newAnn.title} onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })} placeholder="Announcement title" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Content *</label><textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={newAnn.content} onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })} placeholder="Write your message..." /></div>
              <div><label style={labelStyle}>Type</label><select style={inputStyle} value={newAnn.type} onChange={(e) => setNewAnn({ ...newAnn, type: e.target.value })}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label style={labelStyle}>Audience</label><select style={inputStyle} value={newAnn.audience} onChange={(e) => setNewAnn({ ...newAnn, audience: e.target.value })}>{AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><label style={labelStyle}>Priority</label><select style={inputStyle} value={newAnn.priority} onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" isLoading={creating} onClick={handleCreate} leftIcon={<Megaphone size={14} />}>Publish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
