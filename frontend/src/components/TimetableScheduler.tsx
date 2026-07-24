import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Filter, Search, Clock, User, MapPin,
  Sparkles, X, Edit3, Trash2, LayoutGrid, Layers, GraduationCap,
  Send, Bell, Mail, RefreshCw, History,
  AlertCircle, CheckCircle2
} from "lucide-react";
import { Button } from "./ui/Button";
import { api, getToken } from "../utils/api";
import { addHistoryItem } from "../utils/history";
import { HistoryModal } from "./HistoryModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiSchedule {
  id: string;
  batchId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomOrLink: string;
  batch: {
    id: string;
    name: string;
    subject: string;
    capacity: number;
    teacher: {
      id: string;
      user: { firstName: string; lastName: string; email: string };
    };
    enrollments: { id: string }[];
  };
}

interface ApiBatch {
  id: string;
  name: string;
  subject: string;
  capacity: number;
  teacher: { id: string; user: { firstName: string; lastName: string } };
  enrollments: { id: string }[];
}

interface ScheduleCard {
  id: string;
  batchId: string;
  batchName: string;
  subject: string;
  teacherName: string;
  teacherEmail: string;
  roomOrLink: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enrolledCount: number;
  capacity: number;
  color: string;
  bg: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM"
];

const COLOR_PALETTE = [
  { color: "#ec4899", bg: "rgba(236,72,153,0.09)" },
  { color: "#10b981", bg: "rgba(16,185,129,0.09)" },
  { color: "#8b5cf6", bg: "rgba(139,92,246,0.09)" },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
  { color: "#06b6d4", bg: "rgba(6,182,212,0.09)" },
  { color: "#6366f1", bg: "rgba(99,102,241,0.09)" },
  { color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
  { color: "#84cc16", bg: "rgba(132,204,22,0.09)" },
];

// Static fallback batches Grade 5 – 12
const STATIC_BATCHES: ApiBatch[] = [
  { id: "sb-5", name: "Grade 5 – Foundation", subject: "General Studies", capacity: 30, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-6", name: "Grade 6 – Foundation", subject: "General Studies", capacity: 30, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-7", name: "Grade 7 – Science & Maths", subject: "Science & Maths", capacity: 35, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-8", name: "Grade 8 – Science & Maths", subject: "Science & Maths", capacity: 35, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-9", name: "Grade 9 – Science & Maths", subject: "Science & Maths", capacity: 40, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-10", name: "Grade 10 – Science & Maths", subject: "Science & Maths", capacity: 40, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-10c", name: "Grade 10 – Commerce", subject: "Commerce & Accounts", capacity: 35, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-11s", name: "Grade 11 – Science (PCM)", subject: "Physics, Chemistry, Maths", capacity: 40, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-11b", name: "Grade 11 – Science (PCB)", subject: "Physics, Chemistry, Biology", capacity: 40, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-11c", name: "Grade 11 – Commerce", subject: "Commerce & Economics", capacity: 35, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-12s", name: "Grade 12 – Science (PCM)", subject: "Physics, Chemistry, Maths", capacity: 40, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-12b", name: "Grade 12 – Science (PCB)", subject: "Physics, Chemistry, Biology", capacity: 40, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-12c", name: "Grade 12 – Commerce", subject: "Commerce & Economics", capacity: 35, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-jee", name: "JEE Mains Preparation", subject: "Physics, Chemistry, Maths", capacity: 45, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-neet", name: "NEET Preparation", subject: "Physics, Chemistry, Biology", capacity: 45, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
  { id: "sb-olym", name: "Maths Olympiad 2026", subject: "Advanced Mathematics", capacity: 25, teacher: { id: "t0", user: { firstName: "Admin", lastName: "Teacher" } }, enrollments: [] },
];

// Room number options
const ROOM_OPTIONS = [
  "Room 101", "Room 102", "Room 103", "Room 104", "Room 105",
  "Room 201", "Room 202", "Room 203", "Room 204",
  "Physics Lab A", "Physics Lab B", "Chemistry Lab",
  "Computer Lab 1", "Computer Lab 2",
  "Hall A", "Hall B", "Auditorium",
  "Library Hall", "Smart Class 1", "Smart Class 2",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const m = t.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function colorForBatch(batchId: string) {
  let hash = 0;
  const safeId = batchId || "default";
  for (let i = 0; i < safeId.length; i++) hash = safeId.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

function toCard(s: ApiSchedule): ScheduleCard {
  const c = colorForBatch(s.batchId || "default");
  const teacherUser = s.batch?.teacher?.user;
  const teacherName = teacherUser ? `${teacherUser.firstName || ""} ${teacherUser.lastName || ""}`.trim() : "TBD";
  return {
    id: s.id,
    batchId: s.batchId || "default",
    batchName: s.batch?.name || "Unknown Batch",
    subject: s.batch?.subject || "General Studies",
    teacherName: teacherName || "TBD",
    teacherEmail: teacherUser?.email || "",
    roomOrLink: s.roomOrLink || "TBD",
    dayOfWeek: typeof s.dayOfWeek === "number" ? s.dayOfWeek : 0,
    startTime: s.startTime || "08:00 AM",
    endTime: s.endTime || "09:00 AM",
    enrolledCount: s.batch?.enrollments?.length || 0,
    capacity: s.batch?.capacity || 30,
    color: c.color,
    bg: c.bg,
  };
}

// ─── API call using shared api.ts token ──────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function callApi(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "API error");
  return data;
}

// ─── Inline local timetable (works without backend) ──────────────────────────
// When no API batches exist, we store schedules in localStorage
const LS_KEY = "ecrm_local_schedules";

function loadLocalSchedules(): ScheduleCard[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocalSchedules(cards: ScheduleCard[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(cards));
}

// ─── DigitalTimePicker ────────────────────────────────────────────────────────
function DigitalTimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const parse = (t: string) => {
    const m = t.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    return m ? { hour: parseInt(m[1]), minute: parseInt(m[2]), ampm: m[3].toUpperCase() as "AM" | "PM" } : { hour: 8, minute: 0, ampm: "AM" as "AM" | "PM" };
  };

  const { hour, minute, ampm } = parse(value);

  const fmt = (h: number, min: number, ap: "AM" | "PM") => {
    const hStr = h.toString().padStart(2, "0");
    const mStr = min.toString().padStart(2, "0");
    return `${hStr}:${mStr} ${ap}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "hsl(320,20%,96%)", padding: "8px 12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)" }}>
        {/* Hour Input */}
        <select
          value={hour}
          onChange={e => onChange(fmt(parseInt(e.target.value), minute, ampm))}
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "6px 8px", fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", outline: "none", cursor: "pointer" }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>{h.toString().padStart(2, "0")}</option>
          ))}
        </select>

        <span style={{ fontSize: "16px", fontWeight: 900, color: "var(--text-secondary)" }}>:</span>

        {/* Minute Input (Allows selecting ANY random minute 00-59) */}
        <select
          value={minute}
          onChange={e => onChange(fmt(hour, parseInt(e.target.value), ampm))}
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "6px 8px", fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", outline: "none", cursor: "pointer" }}
        >
          {Array.from({ length: 60 }, (_, i) => i).map(m => (
            <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
          ))}
        </select>

        {/* AM/PM Toggle */}
        <button
          type="button"
          onClick={() => onChange(fmt(hour, minute, ampm === "AM" ? "PM" : "AM"))}
          style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 800, color: "#fff", background: ampm === "AM" ? "hsl(271,91%,60%)" : "hsl(328,100%,54%)", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", transition: "all 0.2s" }}
        >
          {ampm}
        </button>
      </div>
    </div>
  );
}

// ─── CustomDropdown ───────────────────────────────────────────────────────────
// Custom scrollable dropdown menu for filter bars and popups
function CustomDropdown<T extends { label: string; value: string }>({
  items, value, onChange, placeholder = "Select option"
}: { items: T[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find(i => i.value === value);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "hsl(320,20%,96%)", border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "10px", padding: "6px 12px", fontSize: "12px", fontWeight: 700,
          color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px",
          cursor: "pointer"
        }}
      >
        <span>{selectedItem ? selectedItem.label : placeholder}</span>
        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
            background: "#ffffff", border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            minWidth: "180px", maxHeight: "200px", overflowY: "auto",
            padding: "4px", display: "flex", flexDirection: "column", gap: "2px"
          }}>
            {items.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => { onChange(item.value); setIsOpen(false); }}
                style={{
                  textAlign: "left", padding: "8px 12px", borderRadius: "8px",
                  border: "none", fontSize: "12px", fontWeight: item.value === value ? 800 : 500,
                  background: item.value === value ? "hsla(328,100%,54%,0.1)" : "transparent",
                  color: item.value === value ? "hsl(328,100%,54%)" : "var(--text-primary)",
                  cursor: "pointer", whiteSpace: "nowrap"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ScrollWheelPicker (CardTilePicker) ────────────────────────────────────────
// A sleek vertical scrollable tile list with quick selection & search indicators
function ScrollWheelPicker<T extends { label: string; value: string }>({
  items, value, onChange, label, accent = "hsl(328,100%,54%)"
}: { items: T[]; value: string; onChange: (v: string) => void; label: string; accent?: string }) {
  const selectedItem = items.find(i => i.value === value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        {selectedItem && (
          <span style={{ fontSize: "11px", fontWeight: 800, color: accent, background: `${accent}15`, padding: "2px 8px", borderRadius: "10px" }}>
            ✓ {selectedItem.label}
          </span>
        )}
      </div>

      <div style={{
        borderRadius: "14px", border: "1px solid rgba(0,0,0,0.1)",
        background: "#ffffff", padding: "6px",
        maxHeight: "140px", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: "4px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
      }}>
        {items.map(item => {
          const isSelected = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: "10px", border: isSelected ? `1.5px solid ${accent}` : "1px solid rgba(0,0,0,0.05)",
                background: isSelected ? `${accent}10` : "hsl(320,20%,98%)",
                color: isSelected ? accent : "var(--text-primary)",
                fontWeight: isSelected ? 800 : 600, fontSize: "12px",
                cursor: "pointer", transition: "all 0.15s", textAlign: "left"
              }}
            >
              <span>{item.label}</span>
              {isSelected && <span style={{ fontSize: "12px", fontWeight: 900, color: accent }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TimetableScheduler() {
  const [viewMode, setViewMode] = useState<"grid" | "batch" | "teacher">("grid");
  const [schedules, setSchedules] = useState<ScheduleCard[]>([]);
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useLocal, setUseLocal] = useState(false); // true = localStorage mode

  // Filters
  const [filterBatch, setFilterBatch] = useState("ALL");
  const [filterTeacher, setFilterTeacher] = useState("ALL");
  const [filterRoom, setFilterRoom] = useState("ALL");
  const [search, setSearch] = useState("");

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<ScheduleCard | null>(null);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<ScheduleCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Quick Reschedule & Substitute State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subTarget, setSubTarget] = useState<ScheduleCard | null>(null);
  const [substituteTeacher, setSubstituteTeacher] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("09:00 AM");
  const [rescheduleRoom, setRescheduleRoom] = useState("Room 101");

  // Form
  const [form, setForm] = useState({
    id: "",
    batchId: "",
    dayOfWeek: 0,
    startTime: "08:00 AM",
    endTime: "09:30 AM",
    roomNo: "",
  });
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const token = getToken();
      if (!token) {
        // No auth token — use local mode with static batches
        setBatches(STATIC_BATCHES);
        setSchedules(loadLocalSchedules());
        setUseLocal(true);
        setLoading(false);
        return;
      }

      const [schRes, batRes] = await Promise.all([
        callApi("/schedules"),
        callApi("/batches"),
      ]);

      const apiBatches: ApiBatch[] = batRes.data || [];
      // Merge: API batches first, then static ones not already present by name
      const merged = [...apiBatches];
      STATIC_BATCHES.forEach(sb => {
        if (!merged.find(b => b.name === sb.name)) merged.push(sb);
      });
      setBatches(merged);
      setSchedules((schRes.data as ApiSchedule[]).map(toCard));
      setUseLocal(false);
    } catch {
      // Fallback to local mode gracefully
      setBatches(STATIC_BATCHES);
      setSchedules(loadLocalSchedules());
      setUseLocal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Conflict check ────────────────────────────────────────────────────────
  const checkConflict = (batchId: string, day: number, start: string, room: string, editId: string) => {
    const others = schedules.filter(s => s.id !== editId);
    const batchConflict = others.find(s => s.batchId === batchId && s.dayOfWeek === day && s.startTime === start);
    if (batchConflict) return `⚠️ "${batchConflict.batchName}" already has a class at ${start} on ${WEEK_DAYS[day]}!`;
    if (room) {
      const roomConflict = others.find(s => s.roomOrLink === room && s.dayOfWeek === day && s.startTime === start);
      if (roomConflict) return `⚠️ ${room} already booked at ${start} on ${WEEK_DAYS[day]}!`;
    }
    return null;
  };

  const handleFormChange = (field: string, value: any) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    const c = checkConflict(updated.batchId, Number(updated.dayOfWeek), updated.startTime, updated.roomNo, updated.id);
    setConflictMsg(c);
  };

  // ── Open modals ───────────────────────────────────────────────────────────
  const openNew = (dayOfWeek = 0, startTime = "08:00 AM") => {
    setForm({ id: "", batchId: batches[0]?.id || "", dayOfWeek, startTime, endTime: "09:30 AM", roomNo: "" });
    setConflictMsg(null);
    setIsFormOpen(true);
  };

  const openEdit = (s: ScheduleCard) => {
    setForm({ id: s.id, batchId: s.batchId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, roomNo: s.roomOrLink === "TBD" ? "" : s.roomOrLink });
    setConflictMsg(null);
    setDetailSession(null);
    setIsFormOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictMsg) return;
    if (!form.batchId) { showToast("Please select a batch", "error"); return; }
    setIsSaving(true);

    const batch = batches.find(b => b.id === form.batchId);
    const c = colorForBatch(form.batchId);
    const roomOrLink = form.roomNo || "TBD";

    // Send to API database even if preset static batch was selected (backend auto-creates batch in DB)
    const batchName = batch?.name || "Unknown Batch";
    const subject = batch?.subject || "General Studies";
    const dayLabel = WEEK_DAYS[Number(form.dayOfWeek)] || "Unknown Day";

    if (useLocal) {
      if (form.id) {
        const updated = schedules.map(s => s.id === form.id ? {
          ...s,
          batchId: form.batchId,
          batchName,
          subject,
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          roomOrLink,
        } : s);
        setSchedules(updated);
        saveLocalSchedules(updated);
        addHistoryItem({
          category: "Class Schedule",
          action: "Updated",
          title: `${batchName} rescheduled`,
          details: `${dayLabel} ${form.startTime} – ${form.endTime} in ${roomOrLink}`,
          badgeColor: c.color,
        });
        showToast("✅ Schedule updated!");
      } else {
        const newCard: ScheduleCard = {
          id: `local-${Date.now()}`,
          batchId: form.batchId,
          batchName,
          subject,
          teacherName: batch ? `${batch.teacher.user.firstName} ${batch.teacher.user.lastName}` : "TBD",
          teacherEmail: "",
          roomOrLink,
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          enrolledCount: batch?.enrollments.length || 0,
          capacity: batch?.capacity || 30,
          color: c.color,
          bg: c.bg,
        };
        const updated = [...schedules, newCard];
        setSchedules(updated);
        saveLocalSchedules(updated);
        addHistoryItem({
          category: "Class Schedule",
          action: "Created",
          title: `${batchName} scheduled`,
          details: `${dayLabel} ${form.startTime} – ${form.endTime} · ${subject} · ${roomOrLink}`,
          badgeColor: c.color,
        });
        showToast("🎉 Class scheduled successfully!");
      }
      setIsFormOpen(false);
      setIsSaving(false);
      return;
    }

    // API mode
    try {
      if (form.id) {
        await callApi(`/schedules/${form.id}`, {
          method: "PUT",
          body: JSON.stringify({ batchId: form.batchId, batchName, subject, dayOfWeek: Number(form.dayOfWeek), startTime: form.startTime, endTime: form.endTime, roomOrLink }),
        });
        addHistoryItem({
          category: "Class Schedule",
          action: "Updated",
          title: `${batchName} rescheduled`,
          details: `${dayLabel} ${form.startTime} – ${form.endTime} in ${roomOrLink}`,
          badgeColor: c.color,
        });
        showToast("✅ Schedule updated in DB! Teacher & students notified via Email.");
      } else {
        await callApi("/schedules", {
          method: "POST",
          body: JSON.stringify({ batchId: form.batchId, batchName, subject, dayOfWeek: Number(form.dayOfWeek), startTime: form.startTime, endTime: form.endTime, roomOrLink }),
        });
        addHistoryItem({
          category: "Class Schedule",
          action: "Created",
          title: `${batchName} scheduled`,
          details: `${dayLabel} ${form.startTime} – ${form.endTime} · ${subject} · ${roomOrLink}`,
          badgeColor: c.color,
        });
        showToast("🎉 Class saved directly to Database! Teacher & students notified.");
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scheduled class slot?")) return;
    const targetCard = schedules.find(s => s.id === id);
    if (useLocal) {
      const updated = schedules.filter(s => s.id !== id);
      setSchedules(updated);
      saveLocalSchedules(updated);
      if (targetCard) {
        addHistoryItem({
          category: "Class Schedule",
          action: "Deleted",
          title: `${targetCard.batchName} class removed`,
          details: `${WEEK_DAYS[targetCard.dayOfWeek]} ${targetCard.startTime} – ${targetCard.endTime} · ${targetCard.roomOrLink}`,
          badgeColor: "#ef4444",
        });
      }
      showToast("Class slot deleted.");
      setDetailSession(null);
      return;
    }
    try {
      await callApi(`/schedules/${id}`, { method: "DELETE" });
      if (targetCard) {
        addHistoryItem({
          category: "Class Schedule",
          action: "Deleted",
          title: `${targetCard.batchName} class removed`,
          details: `${WEEK_DAYS[targetCard.dayOfWeek]} ${targetCard.startTime} – ${targetCard.endTime} · ${targetCard.roomOrLink}`,
          badgeColor: "#ef4444",
        });
      }
      showToast("Class slot deleted.");
      setDetailSession(null);
      loadData();
    } catch (err: any) { showToast(err.message, "error"); }
  };

  // ── Manual Notify ─────────────────────────────────────────────────────────
  const handleManualNotify = async () => {
    if (!notifyTarget) return;
    if (useLocal) {
      showToast("⚡ Notification logged! (Connect backend for real email dispatch)");
      setIsNotifyOpen(false);
      setDetailSession(null);
      return;
    }
    try {
      await callApi(`/schedules/${notifyTarget.id}/notify`, { method: "POST" });
      showToast(`⚡ Emails sent to ${notifyTarget.teacherName} & enrolled students!`);
      setIsNotifyOpen(false);
      setDetailSession(null);
    } catch (err: any) { showToast(err.message, "error"); }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = schedules.filter(s => {
    if (filterBatch !== "ALL" && s.batchId !== filterBatch) return false;
    if (filterTeacher !== "ALL" && s.teacherName !== filterTeacher) return false;
    if (filterRoom !== "ALL" && s.roomOrLink !== filterRoom) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.subject.toLowerCase().includes(q) || s.batchName.toLowerCase().includes(q) ||
        s.teacherName.toLowerCase().includes(q) || s.roomOrLink.toLowerCase().includes(q);
    }
    return true;
  });

  const uniqueTeachers = Array.from(new Set(schedules.map(s => s.teacherName)));
  const uniqueRooms = Array.from(new Set(schedules.map(s => s.roomOrLink).filter(r => r && r !== "TBD")));

  const selectedBatchInfo = batches.find(b => b.id === form.batchId);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", paddingBottom: "40px" }}>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "error" ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#10b981,#059669)",
          color: "#fff", padding: "14px 20px", borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: 800, maxWidth: "400px"
        }}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#1e1b4b 0%,#31104b 50%,#4c1d95 100%)",
        borderRadius: "20px", padding: "24px 30px", color: "#fff",
        boxShadow: "0 12px 36px -6px rgba(49,16,75,0.35)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"
      }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
            padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.2)", marginBottom: "8px"
          }}>
            <Sparkles size={13} style={{ color: "#fbbf24" }} />
            Grade 5–12 · 7-Day Timetable · {useLocal ? "Local Mode" : "Live DB + Auto Email"}
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Timetable Scheduler & Class Manager
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
            Schedule classes for Grade 5–12, assign rooms & teachers. {useLocal ? "Saving locally — login to sync with server." : "Auto-emails sent to teachers & students."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{
            display: "flex", gap: "4px", background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)", padding: "4px", borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.18)"
          }}>
            {(["grid", "batch", "teacher"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 700,
                cursor: "pointer", border: "none", transition: "all 0.2s",
                background: viewMode === mode ? "#ffffff" : "transparent",
                color: viewMode === mode ? "#1e1b4b" : "rgba(255,255,255,0.85)",
                boxShadow: viewMode === mode ? "0 4px 12px rgba(0,0,0,0.15)" : "none"
              }}>
                {mode === "grid" && <LayoutGrid size={15} />}
                {mode === "batch" && <Layers size={15} />}
                {mode === "teacher" && <GraduationCap size={15} />}
                {mode === "grid" ? "Grid" : mode === "batch" ? "By Batch" : "By Teacher"}
              </button>
            ))}
          </div>
          <button onClick={loadData} title="Refresh" style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff", padding: "10px 14px", borderRadius: "12px", cursor: "pointer"
          }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setIsHistoryOpen(true)} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff", padding: "10px 16px", borderRadius: "12px", fontSize: "13px",
            fontWeight: 700, cursor: "pointer"
          }}>
            <History size={16} /> History
          </button>
          <button onClick={() => openNew()} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff",
            padding: "10px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 800,
            cursor: "pointer", border: "none", boxShadow: "0 6px 18px rgba(245,158,11,0.35)"
          }}>
            <Plus size={16} /> Schedule Class
          </button>
        </div>
      </div>

      {/* ── LOCAL MODE NOTICE ──────────────────────────────────────────────── */}
      {useLocal && (
        <div style={{
          background: "hsla(48,96%,53%,0.08)", border: "1px solid hsla(48,96%,53%,0.25)",
          borderRadius: "14px", padding: "12px 18px",
          display: "flex", alignItems: "center", gap: "10px", fontSize: "13px"
        }}>
          <AlertCircle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <span style={{ color: "#92400e", fontWeight: 600 }}>
            <strong>Local mode active</strong> — schedules are saved in this browser. Log in as admin to sync with the server and send real email notifications.
          </span>
        </div>
      )}

      {/* ── FILTER BAR: Horizontal Scrollable Chips ────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: "18px", padding: "16px 20px",
        border: "1px solid rgba(29,10,39,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        display: "flex", flexDirection: "column", gap: "12px"
      }}>
        {/* Row 1: Search & Filter Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
            <Filter size={16} style={{ color: "hsl(328,100%,54%)" }} />
            <span>Filter Batches & Classes</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: "12px" }}>
              {filtered.length} session{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "hsl(320,20%,96%)", border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "12px", padding: "8px 14px", width: "280px"
          }}>
            <Search size={14} style={{ color: "var(--text-secondary)" }} />
            <input
              type="text" placeholder="Search subject, teacher, room…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", width: "100%", color: "var(--text-primary)", fontWeight: 600 }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                <X size={14} style={{ color: "var(--text-secondary)" }} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Horizontal Scrollable Batch Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", minWidth: "50px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Batch:</span>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none",
            maskImage: "linear-gradient(to right, black 92%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 92%, transparent 100%)"
          }}>
            <button
              onClick={() => setFilterBatch("ALL")}
              style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 800,
                border: filterBatch === "ALL" ? "none" : "1px solid rgba(0,0,0,0.08)",
                background: filterBatch === "ALL" ? "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))" : "hsl(320,20%,96%)",
                color: filterBatch === "ALL" ? "#ffffff" : "var(--text-primary)",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                boxShadow: filterBatch === "ALL" ? "0 4px 12px hsla(328,100%,54%,0.3)" : "none",
                transition: "all 0.15s"
              }}
            >
              All Batches ({batches.length})
            </button>
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => setFilterBatch(b.id)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                  border: filterBatch === b.id ? "none" : "1px solid rgba(0,0,0,0.08)",
                  background: filterBatch === b.id ? "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))" : "hsl(320,20%,96%)",
                  color: filterBatch === b.id ? "#ffffff" : "var(--text-primary)",
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  boxShadow: filterBatch === b.id ? "0 4px 12px hsla(328,100%,54%,0.3)" : "none",
                  transition: "all 0.15s"
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Horizontal Scrollable Instructor & Room Chips */}
        {uniqueTeachers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", minWidth: "50px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Teacher:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
              <button
                onClick={() => setFilterTeacher("ALL")}
                style={{
                  padding: "5px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 700,
                  border: filterTeacher === "ALL" ? "none" : "1px solid rgba(0,0,0,0.08)",
                  background: filterTeacher === "ALL" ? "hsl(271,91%,60%)" : "hsl(320,20%,96%)",
                  color: filterTeacher === "ALL" ? "#ffffff" : "var(--text-primary)",
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0
                }}
              >
                All Instructors
              </button>
              {uniqueTeachers.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterTeacher(t)}
                  style={{
                    padding: "5px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 700,
                    border: filterTeacher === t ? "none" : "1px solid rgba(0,0,0,0.08)",
                    background: filterTeacher === t ? "hsl(271,91%,60%)" : "hsl(320,20%,96%)",
                    color: filterTeacher === t ? "#ffffff" : "var(--text-primary)",
                    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── LOADING ──────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ background: "#fff", borderRadius: "20px", padding: "60px", textAlign: "center", color: "var(--text-secondary)", border: "1px solid rgba(29,10,39,0.08)" }}>
          <RefreshCw size={28} style={{ color: "var(--color-accent)", marginBottom: "12px" }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>Loading timetable…</p>
        </div>
      )}

      {/* ── GRID VIEW: Day-Strip Scrollable Cards ────────────────────────────── */}
      {!loading && viewMode === "grid" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {WEEK_DAYS.map((dayName, dayIdx) => {
            const dayCards = filtered.filter(s => s.dayOfWeek === dayIdx);
            const isSunday = dayIdx === 6;
            return (
              <div key={dayName} style={{
                background: "#ffffff", borderRadius: "18px",
                border: isSunday ? "1px solid hsla(328,100%,54%,0.3)" : "1px solid rgba(29,10,39,0.08)",
                boxShadow: isSunday ? "0 4px 20px hsla(328,100%,54%,0.08)" : "0 2px 12px rgba(0,0,0,0.04)",
                overflow: "hidden"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: isSunday ? "linear-gradient(90deg,hsla(328,100%,54%,0.08),transparent)" : "rgba(29,10,39,0.025)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: isSunday ? "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))" : "linear-gradient(135deg,#1e1b4b,#4c1d95)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900 }}>
                      {dayName.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>{dayName} {isSunday && "⭐"}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>{dayCards.length === 0 ? "No classes scheduled" : `${dayCards.length} class${dayCards.length > 1 ? "es" : ""} scheduled`}</div>
                    </div>
                  </div>
                  <button onClick={() => openNew(dayIdx)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "hsla(328,100%,54%,0.08)", border: "1px solid hsla(328,100%,54%,0.18)", color: "hsl(328,100%,54%)", borderRadius: "10px", padding: "7px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    <Plus size={14} /> Add Class
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", overflowX: "auto", padding: "16px 20px", minHeight: "130px" }}>
                  {dayCards.length === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "10px", color: "var(--text-secondary)", opacity: 0.5 }}>
                      <Clock size={22} />
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>No classes on {dayName}. Click "Add Class" to schedule one.</span>
                    </div>
                  ) : (
                    <>
                      {[...dayCards].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)).map((s, i) => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", padding: "0 10px", gap: "6px" }}>
                            {i > 0 && <div style={{ height: "1px", width: "16px", background: "rgba(0,0,0,0.1)" }} />}
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-secondary)", background: "rgba(0,0,0,0.04)", borderRadius: "6px", padding: "2px 6px", whiteSpace: "nowrap" }}>{s.startTime}</span>
                            <div style={{ height: "1px", width: "8px", background: "rgba(0,0,0,0.1)" }} />
                          </div>
                          <div onClick={() => setDetailSession(s)} style={{ background: s.bg, borderRadius: "14px", border: `1px solid ${s.color}33`, borderTop: `4px solid ${s.color}`, padding: "14px 16px", cursor: "pointer", width: "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "5px", boxShadow: `0 4px 16px ${s.color}18` }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: s.color, background: `${s.color}18`, padding: "2px 8px", borderRadius: "20px", alignSelf: "flex-start" }}>{s.subject}</span>
                            <div style={{ fontSize: "12px", fontWeight: 800, color: "#1e1b4b", lineHeight: 1.3 }}>{s.batchName}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px", paddingTop: "7px", borderTop: `1px solid ${s.color}22`, fontSize: "11px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", fontWeight: 700 }}><User size={10} style={{ color: s.color }} />{s.teacherName}</span>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}><Clock size={10} />{s.startTime} – {s.endTime}</span>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}><MapPin size={10} />{s.roomOrLink}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", paddingLeft: "14px", flexShrink: 0 }}>
                        <button onClick={() => openNew(dayIdx)} style={{ width: "80px", height: "90px", border: "2px dashed rgba(0,0,0,0.12)", borderRadius: "14px", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--color-accent)", opacity: 0.7 }}>
                          <Plus size={18} />
                          <span style={{ fontSize: "10px", fontWeight: 700 }}>Add</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BATCH VIEW ───────────────────────────────────────────────────────── */}
      {!loading && viewMode === "batch" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {batches.filter(b => filterBatch === "ALL" || b.id === filterBatch).map(batch => {
            const cards = filtered.filter(s => s.batchId === batch.id);
            if (cards.length === 0) return null;
            return (
              <div key={batch.id} style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1px solid rgba(29,10,39,0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 800, color: "var(--text-primary)" }}>{batch.name}</h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>{batch.subject} · {cards.length} sessions · {batch.teacher.user.firstName} {batch.teacher.user.lastName}</p>
                  </div>
                  <button onClick={() => openNew()} style={{ background: "hsla(328,100%,54%,0.1)", border: "1px solid hsla(328,100%,54%,0.2)", color: "var(--color-accent)", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Plus size={14} /> Add Slot
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
                  {cards.map(s => (
                    <div key={s.id} onClick={() => setDetailSession(s)} style={{ background: s.bg, borderLeft: `4px solid ${s.color}`, borderRadius: "14px", padding: "16px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: `1px solid ${s.color}22` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: s.color }}>{WEEK_DAYS[s.dayOfWeek]}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{s.startTime} – {s.endTime}</span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontWeight: 800, color: "var(--text-primary)" }}>{s.subject}</p>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", paddingTop: "6px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <div>{s.teacherName}</div><div>{s.roomOrLink}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TEACHER VIEW ─────────────────────────────────────────────────────── */}
      {!loading && viewMode === "teacher" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {uniqueTeachers.filter(t => filterTeacher === "ALL" || t === filterTeacher).map(teacherName => {
            const cards = filtered.filter(s => s.teacherName === teacherName);
            if (cards.length === 0) return null;
            return (
              <div key={teacherName} style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1px solid rgba(29,10,39,0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "16px" }}>
                      {teacherName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "17px", fontWeight: 800, color: "var(--text-primary)" }}>{teacherName}</h3>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>{cards.length} sessions/week</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--color-success)", background: "hsla(142,70%,42%,0.1)", padding: "4px 12px", borderRadius: "20px" }}>
                    {useLocal ? "Local Mode" : "Email Notifications Active"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
                  {cards.map(s => (
                    <div key={s.id} onClick={() => setDetailSession(s)} style={{ background: s.bg, borderLeft: `4px solid ${s.color}`, borderRadius: "14px", padding: "16px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: `1px solid ${s.color}22` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: s.color }}>{s.batchName}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{WEEK_DAYS[s.dayOfWeek]}</span>
                      </div>
                      <p style={{ margin: "0 0 6px", fontWeight: 800, color: "var(--text-primary)" }}>{s.subject}</p>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", paddingTop: "6px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <div>{s.startTime} – {s.endTime}</div><div>{s.roomOrLink}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT CLASS ──────────────────────────────────────── */}
      {isFormOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px 16px 100px 16px" // 100px bottom clearance for floating dock!
        }}>
          <div style={{
            background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "500px",
            padding: "24px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", gap: "14px",
            maxHeight: "calc(100vh - 140px)", overflow: "hidden"
          }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {form.id ? "Edit Class Session" : "Schedule New Class"}
                </h3>
                <span style={{ fontSize: "11px", color: "var(--color-success)", fontWeight: 600 }}>
                  {useLocal ? "✓ Saves locally in browser" : "⚡ Auto-emails teacher & all enrolled students on save"}
                </span>
              </div>
              <button onClick={() => setIsFormOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {conflictMsg && (
              <div style={{ background: "hsla(342,90%,48%,0.1)", border: "1px solid hsla(342,90%,48%,0.2)", padding: "12px", borderRadius: "12px", color: "var(--color-danger)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={16} /> {conflictMsg}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              {/* Scrollable Form Body */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingRight: "4px", overflowY: "auto", flex: 1, paddingBottom: "16px" }}>
                {/* Batch ScrollWheelPicker */}
                <ScrollWheelPicker
                  label="Target Batch (Grade 5–12) *"
                  items={batches.map(b => ({ label: b.name, value: b.id }))}
                  value={form.batchId}
                  onChange={val => handleFormChange("batchId", val)}
                  accent="hsl(328,100%,54%)"
                />

                {/* Auto-fill teacher info */}
                {selectedBatchInfo && (
                  <div style={{ background: "hsl(320,20%,97%)", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    📚 Subject: <strong style={{ color: "var(--text-primary)" }}>{selectedBatchInfo.subject}</strong>
                    {" "}· 👨‍🏫 <strong style={{ color: "var(--text-primary)" }}>{selectedBatchInfo.teacher.user.firstName} {selectedBatchInfo.teacher.user.lastName}</strong>
                    {" "}· {selectedBatchInfo.enrollments.length} students enrolled
                  </div>
                )}

                {/* Day ScrollWheelPicker */}
                <ScrollWheelPicker
                  label="Day of Week *"
                  items={WEEK_DAYS.map((d, i) => ({ label: d, value: i.toString() }))}
                  value={form.dayOfWeek.toString()}
                  onChange={val => handleFormChange("dayOfWeek", Number(val))}
                  accent="hsl(271,91%,60%)"
                />

                {/* Digital Time Pickers for Start & End Time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "hsl(320,20%,98%)", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <DigitalTimePicker
                    label="Start Time *"
                    value={form.startTime}
                    onChange={val => handleFormChange("startTime", val)}
                  />
                  <DigitalTimePicker
                    label="End Time *"
                    value={form.endTime}
                    onChange={val => handleFormChange("endTime", val)}
                  />
                </div>

                {/* Room Number ScrollWheelPicker */}
                <ScrollWheelPicker
                  label="Room Number *"
                  items={ROOM_OPTIONS.map(r => ({ label: r, value: r }))}
                  value={form.roomNo}
                  onChange={val => handleFormChange("roomNo", val)}
                  accent="hsl(142,70%,45%)"
                />
              </div>

              {/* Sticky Professional Footer Actions */}
              <div style={{
                display: "flex", gap: "12px", paddingTop: "14px", marginTop: "auto",
                borderTop: "1px solid rgba(0,0,0,0.08)", background: "#ffffff",
                position: "sticky", bottom: 0, zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    flex: 1, padding: "12px 20px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.12)",
                    background: "hsl(320,20%,96%)", color: "var(--text-primary)", fontSize: "13px", fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!conflictMsg || isSaving}
                  style={{
                    flex: 1.5, padding: "12px 20px", borderRadius: "14px", border: "none",
                    background: conflictMsg ? "#cbd5e1" : "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
                    color: "#ffffff", fontSize: "13px", fontWeight: 800,
                    cursor: conflictMsg || isSaving ? "not-allowed" : "pointer",
                    boxShadow: conflictMsg ? "none" : "0 6px 20px hsla(328,100%,54%,0.35)",
                    transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                  }}
                >
                  {isSaving ? "Saving..." : form.id ? "Update Class Slot" : "Save & Schedule Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SESSION DETAILS ───────────────────────────────────────────── */}
      {detailSession && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: detailSession.color, background: detailSession.bg, padding: "3px 8px", borderRadius: "12px" }}>{detailSession.batchName}</span>
                <h3 style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>{detailSession.subject}</h3>
              </div>
              <button onClick={() => setDetailSession(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ background: "hsl(320,20%,97%)", padding: "14px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "7px", fontSize: "13px" }}>
              <div><strong>Day:</strong> {WEEK_DAYS[detailSession.dayOfWeek]}</div>
              <div><strong>Time:</strong> {detailSession.startTime} – {detailSession.endTime}</div>
              <div><strong>Instructor:</strong> {detailSession.teacherName}</div>
              <div><strong>Room No.:</strong> {detailSession.roomOrLink}</div>
              <div><strong>Enrollment:</strong> {detailSession.enrolledCount} / {detailSession.capacity} students</div>
            </div>

            <button
              onClick={() => {
                setSubTarget(detailSession);
                setSubstituteTeacher(detailSession.teacherName);
                setRescheduleTime(detailSession.startTime);
                setRescheduleRoom(detailSession.roomOrLink);
                setIsSubModalOpen(true);
              }}
              style={{
                width: "100%", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                color: "#fff", border: "none", borderRadius: "12px", padding: "12px",
                fontSize: "13px", fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 4px 14px rgba(139,92,246,0.3)"
              }}
            >
              <User size={16} /> Assign Substitute / Quick Reschedule
            </button>

            {!useLocal && (
              <button onClick={() => { setNotifyTarget(detailSession); setIsNotifyOpen(true); }} style={{ width: "100%", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
                <Send size={16} /> Notify Teacher & Students Now
              </button>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <Button variant="secondary" onClick={() => openEdit(detailSession)} style={{ flex: 1 }}><Edit3 size={14} /> Edit</Button>
              <Button onClick={() => handleDelete(detailSession.id)} style={{ flex: 1, background: "var(--color-danger)" }}><Trash2 size={14} /> Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SUBSTITUTE TEACHER / QUICK RESCHEDULE ─────────────────────── */}
      {isSubModalOpen && subTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px 16px 100px 16px"
        }}>
          <div style={{
            background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "480px",
            padding: "24px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", gap: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={18} style={{ color: "hsl(271,91%,60%)" }} />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--text-primary)" }}>
                  Assign Substitute / Quick Reschedule
                </h3>
              </div>
              <button onClick={() => setIsSubModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ background: "hsl(320,20%,97%)", padding: "12px 16px", borderRadius: "12px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div><strong>Class:</strong> {subTarget.subject} ({subTarget.batchName})</div>
              <div><strong>Current Instructor:</strong> {subTarget.teacherName}</div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (useLocal) {
                  const updated = schedules.map(s => s.id === subTarget.id ? {
                    ...s,
                    teacherName: substituteTeacher || s.teacherName,
                    startTime: rescheduleTime || s.startTime,
                    roomOrLink: rescheduleRoom || s.roomOrLink
                  } : s);
                  setSchedules(updated);
                  saveLocalSchedules(updated);
                  showToast("✅ Substitute assigned & schedule updated!");
                } else {
                  await callApi(`/schedules/${subTarget.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                      startTime: rescheduleTime,
                      roomOrLink: rescheduleRoom
                    })
                  });
                  await callApi(`/schedules/${subTarget.id}/notify`, { method: "POST" });
                  showToast(`⚡ Substitute "${substituteTeacher}" assigned! Emails dispatched to students.`);
                  loadData();
                }
                setIsSubModalOpen(false);
                setDetailSession(null);
              } catch (err: any) {
                showToast(err.message, "error");
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <ScrollWheelPicker
                label="Assign Substitute Teacher *"
                items={uniqueTeachers.map(t => ({ label: t, value: t }))}
                value={substituteTeacher}
                onChange={val => setSubstituteTeacher(val)}
                accent="hsl(271,91%,60%)"
              />

              <DigitalTimePicker
                label="Reschedule Start Time *"
                value={rescheduleTime}
                onChange={val => setRescheduleTime(val)}
              />

              <ScrollWheelPicker
                label="Re-assign Room Number *"
                items={ROOM_OPTIONS.map(r => ({ label: r, value: r }))}
                value={rescheduleRoom}
                onChange={val => setRescheduleRoom(val)}
                accent="hsl(142,70%,45%)"
              />

              <div style={{ display: "flex", gap: "10px", paddingTop: "10px" }}>
                <Button type="button" variant="secondary" onClick={() => setIsSubModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" style={{ flex: 1.5, background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", fontWeight: 800 }}>
                  Confirm & Notify Students
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NOTIFY CONFIRMATION ──────────────────────────────────────── */}
      {isNotifyOpen && notifyTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "460px", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={18} style={{ color: "var(--color-accent)" }} />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--text-primary)" }}>Dispatch Lecture Alert</h3>
              </div>
              <button onClick={() => setIsNotifyOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>📨 Sending real emails to:</p>
              <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700 }}>👨‍🏫 {notifyTarget.teacherName}</div>
                <div style={{ color: "#64748b" }}>{notifyTarget.teacherEmail}</div>
              </div>
              <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700 }}>🎓 All {notifyTarget.enrolledCount} students in {notifyTarget.batchName}</div>
              </div>
              <div style={{ padding: "10px 14px", background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", lineHeight: 1.7, fontSize: "12px" }}>
                <div><strong>Subject:</strong> {notifyTarget.subject}</div>
                <div><strong>Day & Time:</strong> {WEEK_DAYS[notifyTarget.dayOfWeek]}, {notifyTarget.startTime} – {notifyTarget.endTime}</div>
                <div><strong>Room No.:</strong> {notifyTarget.roomOrLink}</div>
              </div>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={12} /> Real Email via Resend</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button variant="secondary" onClick={() => setIsNotifyOpen(false)} style={{ flex: 1 }}>Cancel</Button>
              <Button onClick={handleManualNotify} style={{ flex: 1, background: "linear-gradient(135deg,#10b981,#059669)", fontWeight: 800 }}>Confirm & Send Now</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY MODAL ──────────────────────────────────────────────────── */}
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}
