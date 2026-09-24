import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { CalendarDays, Plus, Trash2, Loader2 } from "lucide-react";
import { Modal } from "./ui/Modal";

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
  subject?: string | null;
  teacherName?: string | null;
  batch?: {
    id: string; name: string; subject: string;
    teacher?: { user?: { firstName?: string; lastName?: string } };
  };
}
interface Batch { id: string; name: string; subject?: string; }

export function ClassTimeTable({ userRole = "STUDENT" }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  // Students see only their own timetable — no batch filter. Admin/teacher can filter.
  const canFilterBatches = isAdmin || userRole === "TEACHER";

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState<string>("all");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ batchId: "", dayOfWeek: 0, startTime: "07:00", endTime: "08:00", roomOrLink: "", subject: "", teacherName: "" });

  const load = async () => {
    setIsLoading(true);
    try {
      // Students don't need (and can't access) the full batch list — only admin/teacher filter by batch.
      const [sRes, bRes] = await Promise.all([
        api.schedules.getAll(),
        canFilterBatches ? api.batches.getAll() : Promise.resolve({ data: [] as Batch[] }),
      ]);
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
    if (s.teacherName && s.teacherName.trim()) return s.teacherName.trim();
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

  // Course + session banner (MasterSoft style)
  const selectedBatchObj = batchFilter !== "all" ? batches.find((b) => b.id === batchFilter) : null;
  const courseName = (selectedBatchObj?.name || (batchFilter === "all" ? "ALL BATCHES" : "—")).toUpperCase();
  const yr = new Date().getFullYear();
  const sessionName = `SESSION ${yr}-${yr + 1}`;

  const openAdd = () => {
    setForm({ batchId: batches[0]?.id || "", dayOfWeek: 0, startTime: "07:00", endTime: "08:00", roomOrLink: "", subject: "", teacherName: "" });
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
        subject: (form.subject.trim() || batch?.subject || ""),
        teacherName: form.teacherName.trim(),
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
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarDays size={22} style={{ color: ACCENT }} /> Class Time Table
          </h1>
          <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>
            {isAdmin ? "Build the weekly timetable. Students and teachers are notified on changes." : "Your weekly class schedule."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {canFilterBatches && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "14px", background: "#fff", outline: "none" }}
            >
              <option value="all">All Batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
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
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "1080px", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ background: "#f4f6fa" }}>
                  <th style={cellHead}>TIME SLOT</th>
                  {DAYS.map((d) => (
                    <th key={d} style={cellHead}>{d.toUpperCase()}</th>
                  ))}
                </tr>
                {/* Course / Session banner row */}
                <tr style={{ background: "#fff" }}>
                  <td colSpan={4} style={{ ...cellBody, fontWeight: 800, color: "#3a3f45" }}>
                    COURSE NAME&nbsp;-&gt;&nbsp;{courseName}
                  </td>
                  <td colSpan={4} style={{ ...cellBody, fontWeight: 800, color: "#3a3f45", textAlign: "right" }}>
                    SESSION NAME&nbsp;-&gt;&nbsp;{sessionName}
                  </td>
                </tr>
              </thead>
              <tbody>
                {displaySlots.map((slot) => (
                  <tr key={slot}>
                    <td style={{ ...cellBody, fontWeight: 700, color: "#3a3f45", whiteSpace: "nowrap", background: "#fbfcfe", verticalAlign: "middle", textAlign: "center" }}>{slot}</td>
                    {DAYS.map((_, dayIdx) => {
                      const cells = findCell(slot, dayIdx);
                      return (
                        <td key={dayIdx} style={{ ...cellBody, verticalAlign: "middle", minWidth: "140px", textAlign: "center" }}>
                          {cells.map((s) => {
                            const subject = (s.subject || s.batch?.subject || "Class").toUpperCase();
                            const teacher = teacherName(s);
                            const color = subjectColor(subject);
                            const batchName = s.batch?.name || "";
                            return (
                              <div key={s.id} style={{ position: "relative", marginBottom: cells.length > 1 ? "10px" : 0, paddingRight: isAdmin ? "14px" : 0 }}>
                                {batchName && (
                                  <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 800, color, background: `${color}1a`, borderRadius: "4px", padding: "2px 7px", marginBottom: "4px", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                                    {batchName}
                                  </span>
                                )}
                                <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color, lineHeight: 1.5 }}>
                                  {subject}{teacher ? ` / ${teacher.toUpperCase()}` : ""}
                                </span>
                                {s.roomOrLink ? (
                                  <span style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#6c757d", lineHeight: 1.4, marginTop: "3px" }}>
                                    {s.roomOrLink}
                                  </span>
                                ) : null}
                                {isAdmin && (
                                  <button onClick={() => remove(s.id)} title="Remove"
                                    style={{ position: "absolute", top: 0, right: "-2px", background: "transparent", border: "none", cursor: "pointer", color: "#dc3545", padding: 0, lineHeight: 1 }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
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
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Add Class to Timetable"
          maxWidth={680}
          footer={
            <>
              <button onClick={() => setShowForm(false)} style={{ padding: "10px 18px", background: "#fff", border: "1px solid #dee2e6", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: LABEL }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 22px", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#fff", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
                {saving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />} Add Class
              </button>
            </>
          }
        >
          {formError && <div style={{ background: "#fdecec", color: "#e3342f", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>{formError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px" }}>
            <div>
              <Label>Batch</Label>
              <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} style={inputStyle}>
                <option value="">Select batch</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.subject ? `— ${b.subject}` : ""}</option>)}
              </select>
            </div>
            <div>
              <Label>Day</Label>
              <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })} style={inputStyle}>
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label>Start Time</Label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <Label>End Time</Label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <Label>Subject</Label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics (blank = batch subject)" style={inputStyle} />
            </div>
            <div>
              <Label>Teacher Name</Label>
              <input value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })} placeholder="e.g. Mr. Sharma" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Class Room / Online Link (optional)</Label>
              <input value={form.roomOrLink} onChange={(e) => setForm({ ...form, roomOrLink: e.target.value })} placeholder="e.g. Room 101 or Zoom link" style={inputStyle} />
            </div>
          </div>
        </Modal>
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

// ── Timetable cell styles ─────────────────────────────────
const cellHead: React.CSSProperties = {
  padding: "15px 14px", textAlign: "center", fontWeight: 800, fontSize: "12.5px",
  color: "#495057", border: "1px solid #e3e7ee", letterSpacing: "0.4px",
};
const cellBody: React.CSSProperties = {
  padding: "16px 14px", border: "1px solid #e3e7ee", fontSize: "13px", height: "72px",
};

// Consistent color per subject (deterministic from string) — MasterSoft-style colored labels.
const SUBJECT_COLORS = ["#2f6fed", "#e0457b", "#e58f00", "#159a6e", "#7b52d3", "#0d9488", "#c026d3", "#d9480f"];
function subjectColor(subject: string): string {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length];
}
