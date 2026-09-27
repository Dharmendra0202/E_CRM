import React, { useState, useEffect, useRef } from "react";
import {
  Search, LayoutDashboard, Users2, CalendarDays, CreditCard,
  Briefcase, Check, BookOpen, Target,
  Library, Megaphone, BarChart3, Settings, Shield, FileText,
  Award, TrendingUp, UserCog, Layers, Video, User,
} from "lucide-react";
import { canAccessView } from "./Sidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  /** Caller's role — commands they cannot access are hidden. */
  userRole?: string;
}

/**
 * Every entry here MUST correspond to a view that App.tsx actually renders.
 *
 * Previously this list contained "parents", "academics" and "transport", none of
 * which have a render branch — selecting them navigated to a completely blank
 * screen. It also showed every command to every role, so a student could pick
 * "Roles & Permissions" and just get bounced back to the dashboard.
 */
const COMMANDS = [
  { view: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard", keywords: "home overview" },
  { view: "admissions", icon: <Target size={16} />, label: "Admissions CRM", keywords: "leads enquiry pipeline enquiries" },
  { view: "new-enrollment", icon: <Layers size={16} />, label: "New Enrollment", keywords: "enroll student staff teacher register" },
  { view: "leads", icon: <Users2 size={16} />, label: "Student Management", keywords: "students register search progress" },
  { view: "student-profiles", icon: <Users2 size={16} />, label: "Student Profiles", keywords: "student profile directory" },
  { view: "batches", icon: <Layers size={16} />, label: "Batches", keywords: "batch class group" },
  { view: "staff", icon: <Briefcase size={16} />, label: "Staff", keywords: "employee admin support" },
  { view: "teachers", icon: <UserCog size={16} />, label: "Teachers", keywords: "teacher faculty" },
  { view: "schedule", icon: <CalendarDays size={16} />, label: "Timetable Scheduler", keywords: "schedule class timing" },
  { view: "class-timetable", icon: <CalendarDays size={16} />, label: "Class Time Table", keywords: "timetable classes" },
  { view: "online-classes", icon: <Video size={16} />, label: "Online Classes", keywords: "video live meeting" },
  { view: "attendance", icon: <Check size={16} />, label: "Mark Attendance", keywords: "present absent mark tracker" },
  { view: "class-attendance", icon: <Check size={16} />, label: "Class Attendance", keywords: "attendance summary" },
  { view: "attendance-details", icon: <FileText size={16} />, label: "Attendance Details", keywords: "attendance datewise records" },
  { view: "homework", icon: <FileText size={16} />, label: "Homework", keywords: "assignment task" },
  { view: "examination", icon: <BookOpen size={16} />, label: "Examinations", keywords: "exam test schedule" },
  { view: "exams", icon: <BookOpen size={16} />, label: "Exams & Report Cards", keywords: "exam result report card grade" },
  { view: "marksheet", icon: <Award size={16} />, label: "Marksheet", keywords: "marks grade percentage rank" },
  { view: "weak-students", icon: <TrendingUp size={16} />, label: "Weak Students", keywords: "improvement below average" },
  { view: "bulk-promotion", icon: <Layers size={16} />, label: "Bulk Promotion", keywords: "promote batch year" },
  { view: "billing", icon: <CreditCard size={16} />, label: "Fee Management", keywords: "invoice payment fee billing" },
  { view: "fee-receipt", icon: <CreditCard size={16} />, label: "Fee Receipt", keywords: "receipt payment proof" },
  { view: "library", icon: <Library size={16} />, label: "Library", keywords: "book catalog issue" },
  { view: "communication", icon: <Megaphone size={16} />, label: "Communication", keywords: "announcement notice message" },
  { view: "reports", icon: <BarChart3 size={16} />, label: "Reports & Analytics", keywords: "report chart analytics" },
  { view: "roles", icon: <Shield size={16} />, label: "Roles & Permissions", keywords: "role permission user access" },
  { view: "settings", icon: <Settings size={16} />, label: "Settings", keywords: "config preference organization" },
  { view: "my-profile", icon: <User size={16} />, label: "My Profile", keywords: "account me password" },
];

export function CommandPalette({ isOpen, onClose, onNavigate, userRole }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // toggle handled by parent
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Only offer what this role may actually open, then apply the text filter.
  const q = query.toLowerCase().trim();
  const filtered = COMMANDS
    .filter((cmd) => canAccessView(userRole, cmd.view))
    .filter((cmd) =>
      q === "" ||
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.includes(q)
    );

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onNavigate(filtered[selectedIndex].view);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "520px", background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}
        className="animate-slide-up"
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderBottom: "1px solid var(--border-glass)" }}>
          <Search size={18} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, modules..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", background: "transparent" }}
          />
          <kbd style={{ padding: "2px 8px", borderRadius: "6px", background: "var(--bg-secondary)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", border: "1px solid var(--border-glass)" }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "320px", overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No results for "{query}"</p>
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.view}
                onClick={() => { onNavigate(cmd.view); onClose(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  background: i === selectedIndex ? "rgba(0,123,255,0.06)" : "transparent",
                  transition: "background 0.1s",
                  textAlign: "left",
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span style={{ color: i === selectedIndex ? "var(--color-accent)" : "var(--text-secondary)", display: "flex" }}>{cmd.icon}</span>
                <span>{cmd.label}</span>
                {i === selectedIndex && <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--text-secondary)" }}>Enter ↵</span>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border-glass)", display: "flex", gap: "16px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
