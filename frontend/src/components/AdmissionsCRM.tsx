import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  Users2, Plus, Search, Filter, TrendingUp, ArrowUpRight,
  Phone, Mail, Calendar, MessageSquare, Clock, CheckCircle2,
  XCircle, ChevronRight, X, Send, UserPlus, Target,
} from "lucide-react";

const PIPELINE_STAGES = [
  { key: "NEW", label: "New", color: "hsl(200,95%,50%)" },
  { key: "CONTACTED", label: "Contacted", color: "hsl(271,91%,60%)" },
  { key: "COUNSELLING", label: "Counselling", color: "hsl(38,92%,50%)" },
  { key: "FOLLOW_UP", label: "Follow-up", color: "hsl(328,100%,54%)" },
  { key: "APPLICATION", label: "Application", color: "hsl(200,70%,45%)" },
  { key: "ADMITTED", label: "Admitted", color: "hsl(160,70%,40%)" },
  { key: "FEE_PAID", label: "Fee Paid", color: "hsl(142,70%,42%)" },
  { key: "ENROLLED", label: "Enrolled", color: "hsl(142,70%,35%)" },
  { key: "LOST", label: "Lost", color: "hsl(342,90%,48%)" },
];

const SOURCES = ["Manual Entry", "Website", "Walk-in", "Referral", "Social Media", "Advertisement", "Phone Enquiry"];

export function AdmissionsCRM() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddLead, setShowAddLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // New lead form
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "Manual Entry", course: "", notes: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        api.leads.getAll({ search: searchQuery || undefined, status: filterStatus || undefined }),
        api.leads.getStats(),
      ]);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  useEffect(() => { const t = setTimeout(loadData, 300); return () => clearTimeout(t); }, [searchQuery, filterStatus]);

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.email) return;
    setCreating(true);
    try {
      await api.leads.create(newLead);
      setNewLead({ name: "", email: "", phone: "", source: "Manual Entry", course: "", notes: "" });
      setShowAddLead(false);
      loadData();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await api.leads.update(leadId, { status: newStatus });
      loadData();
      if (selectedLead?.id === leadId) loadLeadDetail(leadId);
    } catch (err) { console.error(err); }
  };

  const loadLeadDetail = async (leadId: string) => {
    try {
      const res = await api.leads.getById(leadId);
      if (res.data) { setSelectedLead(res.data); setActivities(res.data.activities || []); }
    } catch (err) { console.error(err); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedLead) return;
    setAddingNote(true);
    try {
      await api.leads.addActivity(selectedLead.id, { type: "NOTE", content: newNote });
      setNewNote("");
      loadLeadDetail(selectedLead.id);
    } catch (err) { console.error(err); }
    setAddingNote(false);
  };

  const getStageColor = (status: string) => PIPELINE_STAGES.find((s) => s.key === status)?.color || "var(--text-secondary)";

  
  

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Admissions CRM</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Manage enquiries from first contact to enrollment.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddLead(true)} leftIcon={<UserPlus size={14} />}>New Enquiry</Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total Leads", value: stats.total, color: "hsl(271,91%,60%)", badge: `+${stats.thisMonth} this month` },
            { label: "Pending Follow-ups", value: stats.pendingFollowUps, color: "hsl(38,92%,50%)", badge: "overdue" },
            { label: "Conversion Rate", value: `${stats.conversionRate}%`, color: "var(--color-success)", badge: "enrolled" },
            { label: "Pipeline Active", value: stats.total - (stats.pipeline?.ENROLLED || 0) - (stats.pipeline?.LOST || 0), color: "hsl(328,100%,54%)", badge: "in progress" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-glass)", boxShadow: "0 2px 8px rgba(29,10,39,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: s.color, background: `${s.color}12`, padding: "2px 7px", borderRadius: "10px" }}>{s.badge}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Mini-Bar */}
      {stats?.pipeline && (
        <div style={{ display: "flex", gap: "3px", marginBottom: "20px", height: "6px", borderRadius: "3px", overflow: "hidden", background: "var(--bg-secondary)" }}>
          {PIPELINE_STAGES.filter((s) => s.key !== "LOST").map((stage) => {
            const count = stats.pipeline[stage.key] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return pct > 0 ? <div key={stage.key} title={`${stage.label}: ${count}`} style={{ width: `${pct}%`, background: stage.color, borderRadius: "3px", transition: "width 0.5s" }} /> : null;
          })}
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input style={{ ...inputStyle, paddingLeft: "36px" }} placeholder="Search leads by name, email, phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select style={{ ...inputStyle, width: "180px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Stages</option>
          {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* Leads List */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden", boxShadow: "0 2px 12px rgba(29,10,39,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 130px 120px 80px", padding: "12px 20px", background: "rgba(29,10,39,0.02)", borderBottom: "1px solid var(--border-glass)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
          <div>Lead</div><div>Source</div><div>Stage</div><div>Follow-up</div><div></div>
        </div>

        {isLoading ? (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rect" height={52} />)}
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <Users2 size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>No leads found.</p>
          </div>
        ) : (
          leads.map((lead) => {
            const stageColor = getStageColor(lead.status);
            const stageLabel = PIPELINE_STAGES.find((s) => s.key === lead.status)?.label || lead.status;
            const followUp = lead.nextFollowUp ? new Date(lead.nextFollowUp) : null;
            const isOverdue = followUp && followUp < new Date();

            return (
              <div key={lead.id} onClick={() => loadLeadDetail(lead.id)}
                style={{ display: "grid", gridTemplateColumns: "1fr 140px 130px 120px 80px", padding: "14px 20px", borderBottom: "1px solid var(--border-glass)", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "hsla(328,100%,54%,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${stageColor}15`, border: `1.5px solid ${stageColor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: stageColor }}>
                    {lead.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{lead.name}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{lead.email} · {lead.phone}</p>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>{lead.source}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: stageColor, background: `${stageColor}12`, padding: "4px 10px", borderRadius: "20px", display: "inline-block", width: "fit-content" }}>{stageLabel}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: isOverdue ? "var(--color-danger)" : "var(--text-secondary)" }}>
                  {followUp ? followUp.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                </span>
                <ChevronRight size={14} style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
              </div>
            );
          })
        )}
      </div>

      {/* ═══ LEAD DETAIL DRAWER ═══ */}
      {selectedLead && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 9999 }} onClick={() => setSelectedLead(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "480px", maxWidth: "90vw", background: "#fff", height: "100vh", overflowY: "auto", padding: "24px", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)" }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800 }}>{selectedLead.name}</h2>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>{selectedLead.email} · {selectedLead.phone}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={20} /></button>
            </div>

            {/* Stage Selector */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Pipeline Stage</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {PIPELINE_STAGES.map((stage) => (
                  <button key={stage.key} onClick={() => handleStatusChange(selectedLead.id, stage.key)}
                    style={{
                      padding: "5px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                      background: selectedLead.status === stage.key ? `${stage.color}18` : "transparent",
                      border: `1.5px solid ${selectedLead.status === stage.key ? stage.color : "var(--border-glass)"}`,
                      color: selectedLead.status === stage.key ? stage.color : "var(--text-secondary)",
                    }}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lead Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {[
                { label: "Source", value: selectedLead.source, icon: <Target size={12} /> },
                { label: "Course", value: selectedLead.course || "—", icon: <CheckCircle2 size={12} /> },
                { label: "Follow-up", value: selectedLead.nextFollowUp ? new Date(selectedLead.nextFollowUp).toLocaleDateString("en-IN") : "None set", icon: <Calendar size={12} /> },
                { label: "Created", value: new Date(selectedLead.createdAt).toLocaleDateString("en-IN"), icon: <Clock size={12} /> },
              ].map((item, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>{item.icon} {item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Add Note */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Add Note</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Write a note or follow-up..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddNote()} />
                <Button variant="primary" isLoading={addingNote} onClick={handleAddNote} style={{ padding: "10px 14px" }}><Send size={14} /></Button>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label style={labelStyle}>Activity Timeline</label>
              {activities.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", padding: "20px 0" }}>No activities yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activities.map((act) => {
                    const typeColors: Record<string, string> = {
                      NOTE: "hsl(200,95%,50%)", STATUS_CHANGE: "hsl(271,91%,60%)", FOLLOW_UP: "hsl(38,92%,50%)",
                      CALL: "hsl(142,70%,42%)", EMAIL: "hsl(328,100%,54%)", MEETING: "hsl(342,90%,48%)",
                    };
                    const color = typeColors[act.type] || "var(--text-secondary)";
                    return (
                      <div key={act.id} style={{ display: "flex", gap: "10px", padding: "10px 12px", background: `${color}06`, borderRadius: "10px", border: `1px solid ${color}12` }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, marginTop: "5px", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{act.content}</p>
                          <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>
                            {act.type.replace("_", " ")} · {new Date(act.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD LEAD MODAL ═══ */}
      {showAddLead && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowAddLead(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>New Enquiry</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Student name" />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="+91..." />
              </div>
              <div>
                <label style={labelStyle}>Source</label>
                <select style={inputStyle} value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Course Interest</label>
                <input style={inputStyle} value={newLead.course} onChange={(e) => setNewLead({ ...newLead, course: e.target.value })} placeholder="e.g. Mathematics" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Notes</label>
                <input style={inputStyle} value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} placeholder="Any additional info..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowAddLead(false)}>Cancel</Button>
              <Button variant="primary" isLoading={creating} onClick={handleCreateLead} leftIcon={<UserPlus size={14} />}>Create Lead</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
