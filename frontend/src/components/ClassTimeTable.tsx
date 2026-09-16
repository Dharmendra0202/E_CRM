import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { CalendarDays, Plus, Trash2, X, Loader2 } from "lucide-react";

const ACCENT = "#007bff";
const ACCENT_DARK = "#0069d9";
const LABEL = "#60686f";
const VALUE = "#6c757d";
const CARD_SHADOW = "rgba(90, 97, 105, 0.1) 0px 7.5px 35px 0px, rgba(90, 97, 105, 0.1) 0px 2px 3px 0px";
const FONT = "'Nunito', 'Segoe UI', Arial, sans-serif";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Schedule {
  id: string;
  batchId: string;
  dayOfWeek: number; // 0=Mon .. 6=Sun
  startTime: string;
  endTime: string;
  roomOrLink?: string;
  batch?: {
    id: string; name: string; subject: string;
    teacher?: { user?: { firstName?: string; lastName?: string } };
  };
}
interface Batch { id: string; name: string; subject?: string; }

export function ClassTimeTable({ userRole = "ADMIN" }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState<string>("all");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ batchId: "", dayOfWeek: 0, startTime: "07:00", endTime: "08:00", roomOrLink: "" });

  const load = async () => {
    setIsLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([api.schedules.getAll(), api.batches.getAll()]);
      setSchedules(sRes.data || []);
      setBatches(bRes.data || []);
    } catch {
      setSchedules([]);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const teacherName = (s: Schedule) => {
    const t = s.batch?.teacher?.user;
    return t ? `${t.firstName || ""} ${t.lastName || ""}`.trim() : "";
  };

  const slotLabel = (s: Schedule) => `${s.startTime} - ${s.endTime}`;

  const visibleSchedules = batchFilter === "all"
    ? schedules
    : schedules.filter((s) => s.batchId === batchFilter);

  // Build a lookup: slotLabel -> day -> schedules[]
  const findCell = (slot: string, dayIdx: number) =>
    visibleSchedules.filter((s) => slotLabel(s) === slot && s.dayOfWeek === dayIdx);

  // Build the row list dynamically from actual scheduled times, sorted chronologically
  const parseStart = (label: string): number => {
    // label like "07:30 AM - 09:30 AM" -> minutes from midnight of the start time
    const m = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = (m[3] || "").toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return h * 60 + min;
  };
  const usedSlots = Array.from(new Set(visibleSchedules.map((s) => slotLabel(s))))
    .sort((a, b) => parseStart(a) - parseStart(b));
  const displaySlots = usedSlots;

  const openAdd = () => {
    setForm({ batchId: batches[0]?.id || "", dayOfWeek: 0, startTime: "07:00", endTime: "08:00", roomOrLink: "" });
    setFormError("");
    setShowForm(true);
  };

  // Convert "HH:mm" (24h) → "hh:mm AM/PM" for display + storage consistency
  const to12h = (t: string) => {
    if (!t) return "";
    const [hStr, m] = t.split(":");
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  };

  const save = async () => {
    if (!form.batchId) { setFormError("Please select a batch."); return; }
    if (!form.startTime || !form.endTime) { setFormError("Please set start and end time."); return; }
    if (form.startTime >= form.endTime) { setFormError("End time must be after start time."); return; }
    const startTime = to12h(form.startTime);
    const endTime = to12h(form.endTime);
    const batch = batches.find((b) => b.id === form.batchId);
    setSaving(true);
    setFormError("");
    try {
      await api.schedules.create({
        batchId: form.batchId,
        batchName: batch?.name,
        subject: batch?.subject,
        dayOfWeek: form.dayOfWeek,
        startTime,
        endTime,
        roomOrLink: form.roomOrLink,
      });
      setShowForm(false);
      await load();
    } catch (e: any) {
      setFormError(e?.message || "Failed to add class (time slot may conflict).");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this class from the timetable?")) return;
    try { await api.schedules.delete(id); await load(); } catch { /* ignore */ }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarDays size={22} style={{ color: ACCENT }} /> Class Time Table
          </h2>
          <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>
            {isAdmin ? "Build the weekly timetable. Students and teachers are notified on changes." : "Your weekly class schedule."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "14px", background: "#fff", outline: "none" }}
          >
            <option value="all">All Batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {isAdmin && (
            <button onClick={openAdd}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
              <Plus size={16} /> Add Class
            </button>
          )}
        </div>
      </div>

      {/* Grid card */}
      <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: VALUE }}>
            <Loader2 size={26} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "14px" }}>Loading timetable...</span>
          </div>
        ) : displaySlots.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#a0a6ad", fontSize: "14px" }}>
            No classes scheduled yet.{isAdmin ? " Click 'Add Class' to begin." : ""}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "900px" }}>
              <thead>
                <tr style={{ background: "#fafbfe" }}>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: LABEL, borderBottom: "2px solid #eef0f4", width: "150px" }}>Time Slot</th>
                  {DAYS.map((d) => (
                    <th key={d} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: LABEL, borderBottom: "2px solid #eef0f4" }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displaySlots.map((slot) => (
                  <tr key={slot} style={{ borderBottom: "1px solid #f0f1f4" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#3a3f45", whiteSpace: "nowrap", background: "#fafbfe" }}>{slot}</td>
                    {DAYS.map((_, dayIdx) => {
                      const cells = findCell(slot, dayIdx);
                      return (
                        <td key={dayIdx} style={{ padding: "8px 10px", verticalAlign: "top", minWidth: "130px" }}>
                          {cells.map((s) => (
                            <div key={s.id} style={{
                              background: "#eef0fe", borderRadius: "6px", padding: "8px 10px", marginBottom: "6px",
                              borderLeft: `3px solid ${ACCENT}`, position: "relative",
                            }}>
                              <div style={{ fontWeight: 700, color: ACCENT, fontSize: "12px" }}>{s.batch?.subject || "Class"}</div>
                              <div style={{ color: "#5a6169", fontSize: "11px", marginTop: "2px" }}>{s.batch?.name}</div>
                              {teacherName(s) && <div style={{ color: VALUE, fontSize: "11px" }}>{teacherName(s)}</div>}
                              {s.roomOrLink && <div style={{ color: VALUE, fontSize: "10px", marginTop: "2px" }}>📍 {s.roomOrLink}</div>}
                              {isAdmin && (
                                <button onClick={() => remove(s.id)} title="Remove"
                                  style={{ position: "absolute", top: "4px", right: "4px", background: "transparent", border: "none", cursor: "pointer", color: "#e3342f", padding: "2px" }}>
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showForm && (
        <div onClick={() => setShowForm(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f0f1f4" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#3a3f45" }}>Add Class to Timetable</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: VALUE }}><X size={20} /></button>
            </div>
            <div style={{ padding: "22px" }}>
              {formError && <div style={{ background: "#fdecec", color: "#e3342f", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>{formError}</div>}
              <Label>Batch</Label>
              <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} style={inputStyle}>
                <option value="">Select batch</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.subject ? `— ${b.subject}` : ""}</option>)}
              </select>
              <div style={{ height: "14px" }} />
              <Label>Day</Label>
              <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })} style={inputStyle}>
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <div style={{ height: "14px" }} />
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <Label>Start Time</Label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>End Time</Label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ height: "14px" }} />
              <Label>Room / Online Link (optional)</Label>
              <input value={form.roomOrLink} onChange={(e) => setForm({ ...form, roomOrLink: e.target.value })} placeholder="e.g. Room 101 or Zoom link" style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px 22px", borderTop: "1px solid #f0f1f4" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "10px 18px", background: "#fff", border: "1px solid #dee2e6", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: LABEL }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 22px", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#fff", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
                {saving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />} Add Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #dee2e6",
  fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#fff",
};
function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3a3f45", marginBottom: "6px" }}>{children}</label>;
}
