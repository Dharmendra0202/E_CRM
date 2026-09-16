import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Modal } from "./ui/Modal";
import {
  Plus, Video, Pencil, Trash2,
  ExternalLink, Loader2,
} from "lucide-react";

const ACCENT = "#007bff";
const ACCENT_DARK = "#0069d9";
const LABEL = "#60686f";
const VALUE = "#6c757d";
const FIELD_BG = "#f4f5f9";
const CARD_SHADOW = "rgba(90, 97, 105, 0.1) 0px 7.5px 35px 0px, rgba(90, 97, 105, 0.1) 0px 2px 3px 0px";
const FONT = "'Nunito', 'Segoe UI', Arial, sans-serif";

interface OnlineClass {
  id: string;
  courseName: string;
  subjectName: string;
  scheduleDate: string;
  scheduleTime: string;
  theoryBatch?: string | null;
  practicalBatch?: string | null;
  teacherName?: string | null;
  classLink?: string | null;
  meetingId?: string | null;
  status: string;
  bucket?: "TODAY" | "UPCOMING" | "COMPLETED";
}

type Tab = "today" | "upcoming" | "completed";

const EMPTY_FORM = {
  courseName: "", subjectName: "", scheduleDate: "", scheduleTime: "",
  theoryBatch: "", practicalBatch: "", teacherName: "", classLink: "", meetingId: "",
};

// ═══════════════════════════ ONLINE CLASSES ═══════════════════════════
export function OnlineClasses({ userRole = "ADMIN" }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "TEACHER";

  const [tab, setTab] = useState<Tab>("today");
  const [classes, setClasses] = useState<OnlineClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await api.onlineClasses.getAll(tab);
      setClasses(res.data || []);
    } catch {
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (c: OnlineClass) => {
    setEditId(c.id);
    setForm({
      courseName: c.courseName || "", subjectName: c.subjectName || "",
      scheduleDate: c.scheduleDate ? c.scheduleDate.slice(0, 10) : "",
      scheduleTime: c.scheduleTime || "",
      theoryBatch: c.theoryBatch || "", practicalBatch: c.practicalBatch || "",
      teacherName: c.teacherName || "", classLink: c.classLink || "", meetingId: c.meetingId || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const save = async () => {
    if (!form.courseName || !form.subjectName || !form.scheduleDate || !form.scheduleTime) {
      setFormError("Course, Subject, Date and Time are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editId) await api.onlineClasses.update(editId, form);
      else await api.onlineClasses.create(form);
      setShowForm(false);
      await load();
    } catch (e: any) {
      setFormError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this online class?")) return;
    try {
      await api.onlineClasses.delete(id);
      await load();
    } catch { /* ignore */ }
  };

  const filtered = classes.filter((c) =>
    [c.courseName, c.subjectName, c.teacherName, c.theoryBatch, c.practicalBatch]
      .filter(Boolean)
      .some((v) => (v as string).toLowerCase().includes(search.toLowerCase()))
  );

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "upcoming", label: "Upcoming" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div className="animate-fade-in" style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Video size={22} style={{ color: ACCENT }} /> Online Classes
          </h2>
          <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>
            {isAdmin ? "Schedule and manage online classes for your students." : "Your scheduled online classes."}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#fff",
              border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600,
            }}
          >
            <Plus size={16} /> Add Class
          </button>
        )}
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, overflow: "hidden" }}>
        {/* Tabs + search */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "16px 20px", borderBottom: "1px solid #f0f1f4" }}>
          <div style={{ display: "flex", gap: "6px", background: FIELD_BG, padding: "4px", borderRadius: "8px" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "8px 18px", borderRadius: "6px", border: "none", cursor: "pointer",
                  fontSize: "13px", fontWeight: 600,
                  background: tab === t.id ? "#fff" : "transparent",
                  color: tab === t.id ? ACCENT : VALUE,
                  boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "14px", outline: "none", minWidth: "220px" }}
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: VALUE }}>
            <Loader2 size={26} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "14px" }}>Loading classes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#a0a6ad", fontSize: "14px" }}>
            No {tab} classes found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "820px" }}>
              <thead>
                <tr style={{ background: "#fafbfe", color: LABEL, textAlign: "left" }}>
                  <Th>Sr.No</Th>
                  <Th>Course Name</Th>
                  <Th>Subject Name</Th>
                  <Th>Schedule Date</Th>
                  <Th>Schedule Time</Th>
                  <Th>Theory Batch</Th>
                  <Th>Practical Batch</Th>
                  <Th>Teacher</Th>
                  <Th>Class</Th>
                  {isAdmin && <Th>Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f0f1f4" }}>
                    <Td>{i + 1}</Td>
                    <Td strong>{c.courseName}</Td>
                    <Td>{c.subjectName}</Td>
                    <Td>{fmtDate(c.scheduleDate)}</Td>
                    <Td>{c.scheduleTime}</Td>
                    <Td>{c.theoryBatch || "—"}</Td>
                    <Td>{c.practicalBatch || "—"}</Td>
                    <Td>{c.teacherName || "—"}</Td>
                    <Td>
                      {c.classLink ? (
                        <a href={c.classLink} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: ACCENT, fontWeight: 600, textDecoration: "none" }}>
                          Join <ExternalLink size={13} />
                        </a>
                      ) : "—"}
                    </Td>
                    {isAdmin && (
                      <Td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => openEdit(c)} title="Edit"
                            style={{ background: "#eef0fe", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: ACCENT }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => remove(c.id)} title="Delete"
                            style={{ background: "#fdecec", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#e3342f" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editId ? "Edit Online Class" : "Add Online Class"}
          maxWidth={560}
          footer={
            <>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "10px 18px", background: "#fff", border: "1px solid #dee2e6", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: LABEL }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                style={{ padding: "10px 22px", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#fff", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
                {saving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
                {editId ? "Save Changes" : "Add Class"}
              </button>
            </>
          }
        >
          {formError && (
            <div style={{ background: "#fdecec", color: "#e3342f", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>
              {formError}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <ModalField label="Course Name" required value={form.courseName} onChange={(v) => setForm({ ...form, courseName: v })} placeholder="e.g. Class 10 Science" />
            <ModalField label="Subject Name" required value={form.subjectName} onChange={(v) => setForm({ ...form, subjectName: v })} placeholder="e.g. Physics" />
            <ModalField label="Schedule Date" required type="date" value={form.scheduleDate} onChange={(v) => setForm({ ...form, scheduleDate: v })} />
            <ModalField label="Schedule Time" required value={form.scheduleTime} onChange={(v) => setForm({ ...form, scheduleTime: v })} placeholder="e.g. 10:00 AM - 11:00 AM" />
            <ModalField label="Theory Batch" value={form.theoryBatch} onChange={(v) => setForm({ ...form, theoryBatch: v })} placeholder="Batch name" />
            <ModalField label="Practical Batch" value={form.practicalBatch} onChange={(v) => setForm({ ...form, practicalBatch: v })} placeholder="Batch name" />
            <ModalField label="Teacher" value={form.teacherName} onChange={(v) => setForm({ ...form, teacherName: v })} placeholder="Teacher name" />
            <ModalField label="Meeting ID" value={form.meetingId} onChange={(v) => setForm({ ...form, meetingId: v })} placeholder="Optional" />
          </div>
          <div style={{ marginTop: "14px" }}>
            <ModalField label="Class Link (Zoom / Meet / etc.)" value={form.classLink} onChange={(v) => setForm({ ...form, classLink: v })} placeholder="https://..." fullWidth />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "2px solid #eef0f4" }}>{children}</th>;
}
function Td({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <td style={{ padding: "12px 16px", color: strong ? "#3a3f45" : "#5a6169", fontWeight: strong ? 600 : 400, whiteSpace: "nowrap" }}>{children}</td>;
}

function ModalField({ label, value, onChange, placeholder, required, type, fullWidth }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string; fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3a3f45", marginBottom: "6px" }}>
        {required && <span style={{ color: "#e3342f" }}>* </span>}{label}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}


