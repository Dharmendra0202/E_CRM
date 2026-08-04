import React, { useState, useEffect, useRef } from "react";
import {
  Search, LayoutDashboard, Users2, CalendarDays, CreditCard,
  Briefcase, Check, BookOpen, GraduationCap, Target, UserCheck,
  Bus, Library, Megaphone, BarChart3, Settings, Shield, FileText,
  Command,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

const COMMANDS = [
  { view: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard", keywords: "home overview" },
  { view: "admissions", icon: <Target size={16} />, label: "Admissions CRM", keywords: "leads enquiry pipeline" },
  { view: "leads", icon: <Users2 size={16} />, label: "Students", keywords: "student list manage" },
  { view: "parents", icon: <UserCheck size={16} />, label: "Parents", keywords: "parent guardian" },
  { view: "staff", icon: <Briefcase size={16} />, label: "Staff & Teachers", keywords: "teacher employee" },
  { view: "academics", icon: <GraduationCap size={16} />, label: "Academics", keywords: "subject course curriculum" },
  { view: "schedule", icon: <CalendarDays size={16} />, label: "Timetable", keywords: "schedule class timing" },
  { view: "attendance", icon: <Check size={16} />, label: "Attendance", keywords: "present absent mark" },
  { view: "homework", icon: <FileText size={16} />, label: "Homework", keywords: "assignment task" },
  { view: "exams", icon: <BookOpen size={16} />, label: "Exams & Results", keywords: "exam test marks grade" },
  { view: "billing", icon: <CreditCard size={16} />, label: "Fee Management", keywords: "invoice payment fee" },
  { view: "transport", icon: <Bus size={16} />, label: "Transport", keywords: "bus route vehicle" },
  { view: "library", icon: <Library size={16} />, label: "Library", keywords: "book catalog issue" },
  { view: "communication", icon: <Megaphone size={16} />, label: "Communication", keywords: "announcement notice" },
  { view: "reports", icon: <BarChart3 size={16} />, label: "Reports & Analytics", keywords: "report chart analytics" },
  { view: "roles", icon: <Shield size={16} />, label: "Roles & Permissions", keywords: "role permission user" },
  { view: "settings", icon: <Settings size={16} />, label: "Settings", keywords: "config preference" },
];

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
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

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.keywords.includes(query.toLowerCase())
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
                  background: i === selectedIndex ? "hsla(328,100%,54%,0.06)" : "transparent",
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
