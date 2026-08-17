import React, { useState } from "react";
import {
  LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  Check, BookOpen, GraduationCap, Target, UserCheck, Bus,
  Library, Megaphone, BarChart3, Settings, Shield, FileText,
  ChevronLeft, ChevronRight, ChevronDown, Layers, Smartphone,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  { group: "Main", items: [
    { view: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { view: "admissions", icon: <Target size={18} />, label: "Admissions" },
    { view: "new-enrollment", icon: <Layers size={18} />, label: "New Enrollment" },
    { view: "online-admissions", icon: <Smartphone size={18} />, label: "Online Admissions" },
  ]},
  { group: "People", items: [
    { view: "leads", icon: <Users2 size={18} />, label: "Students" },
    { view: "staff", icon: <Briefcase size={18} />, label: "Staff" },
    { view: "teachers", icon: <GraduationCap size={18} />, label: "Teachers" },
  ]},
  { group: "Academics", items: [
    { view: "academics", icon: <GraduationCap size={18} />, label: "Academics" },
    { view: "batches", icon: <Layers size={18} />, label: "Batches" },
    { view: "schedule", icon: <CalendarDays size={18} />, label: "Timetable" },
    { view: "attendance", icon: <Check size={18} />, label: "Attendance" },
    { view: "homework", icon: <FileText size={18} />, label: "Homework" },
    { view: "exams", icon: <BookOpen size={18} />, label: "Report Cards" },
    { view: "examination", icon: <BookOpen size={18} />, label: "Examinations" },
    { view: "marksheet", icon: <BarChart3 size={18} />, label: "Marksheet" },
    { view: "weak-students", icon: <Users2 size={18} />, label: "Weak Students" },
    { view: "bulk-promotion", icon: <Users2 size={18} />, label: "Bulk Promotion" },
  ]},
  { group: "Operations", items: [
    { view: "billing", icon: <CreditCard size={18} />, label: "Payment Records" },
    { view: "transport", icon: <Bus size={18} />, label: "Transport" },
    { view: "library", icon: <Library size={18} />, label: "Library" },
    { view: "communication", icon: <Megaphone size={18} />, label: "Notices" },
  ]},
  { group: "Insights", items: [
    { view: "reports", icon: <BarChart3 size={18} />, label: "Reports" },
    { view: "roles", icon: <Shield size={18} />, label: "Roles" },
    { view: "settings", icon: <Settings size={18} />, label: "Settings" },
  ]},
];

export function Sidebar({ currentView, onNavigate, collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Main", "People", "Academics"]));

  const toggleGroup = (group: string) => {
    const next = new Set(openGroups);
    if (next.has(group)) next.delete(group); else next.add(group);
    setOpenGroups(next);
  };

  // Auto-expand the group that contains the active view
  const activeGroup = NAV_ITEMS.find(g => g.items.some(i => i.view === currentView))?.group;
  if (activeGroup && !openGroups.has(activeGroup)) {
    openGroups.add(activeGroup);
  }

  return (
    <>
    {/* Mobile overlay */}
    {mobileOpen && <div className={`sidebar-overlay ${mobileOpen ? "visible" : ""}`} onClick={onMobileClose} />}
    <aside
      className={mobileOpen ? "mobile-open" : ""}
      style={{
        width: collapsed ? "64px" : "220px",
        height: "100vh",
        background: "hsla(0,0%,100%,0.92)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid var(--border-glass)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 60,
        overflowX: "hidden",
        boxShadow: "2px 0 20px rgba(29,10,39,0.04)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? "16px 12px" : "16px 18px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-glass)", minHeight: "56px", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <GraduationCap size={16} color="#fff" />
        </div>
        {!collapsed && <span style={{ fontSize: "15px", fontWeight: 800, fontFamily: "var(--font-headings)", whiteSpace: "nowrap" }} className="text-gradient-indigo">EduFlow</span>}
      </div>

      {/* Nav Groups - Scrollable */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 8px", minHeight: 0 }}>
        {NAV_ITEMS.map((group) => {
          const isOpen = openGroups.has(group.group);
          const hasActive = group.items.some(i => i.view === currentView);
          return (
          <div key={group.group} style={{ marginBottom: "6px" }}>
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.group)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "6px 10px", margin: "0 0 2px",
                  border: "none", background: "transparent", cursor: "pointer",
                  fontSize: "10px", fontWeight: 700, color: hasActive ? "var(--color-accent)" : "var(--text-secondary)",
                  textTransform: "uppercase", letterSpacing: "0.8px",
                }}
              >
                <span>{group.group}</span>
                <ChevronDown size={12} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
              </button>
            )}
            {(collapsed || isOpen) && group.items.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => { onNavigate(item.view); if (onMobileClose) onMobileClose(); }}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: collapsed ? "10px 12px" : "8px 12px",
                    margin: "2px 0",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? "var(--color-accent)" : "var(--text-secondary)",
                    background: isActive ? "hsla(328,100%,54%,0.08)" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "left",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "hsla(285,30%,20%,0.04)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
                </button>
              );
            })}
          </div>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        style={{
          padding: "12px",
          background: "transparent",
          border: "none",
          borderTop: "1px solid var(--border-glass)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          transition: "color 0.2s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
    </>
  );
}
