import React, { useState } from "react";
import {
  LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  Check, BookOpen, GraduationCap, Target, UserCheck, Bus,
  Library, Megaphone, BarChart3, Settings, Shield, FileText,
  ChevronLeft, ChevronRight, Layers,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS = [
  { group: "Main", items: [
    { view: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { view: "admissions", icon: <Target size={18} />, label: "Admissions" },
  ]},
  { group: "People", items: [
    { view: "leads", icon: <Users2 size={18} />, label: "Students" },
    { view: "parents", icon: <UserCheck size={18} />, label: "Parents" },
    { view: "staff", icon: <Briefcase size={18} />, label: "Staff" },
  ]},
  { group: "Academics", items: [
    { view: "academics", icon: <GraduationCap size={18} />, label: "Academics" },
    { view: "schedule", icon: <CalendarDays size={18} />, label: "Timetable" },
    { view: "attendance", icon: <Check size={18} />, label: "Attendance" },
    { view: "homework", icon: <FileText size={18} />, label: "Homework" },
    { view: "exams", icon: <BookOpen size={18} />, label: "Exams" },
  ]},
  { group: "Operations", items: [
    { view: "billing", icon: <CreditCard size={18} />, label: "Fees" },
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

export function Sidebar({ currentView, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
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
        {NAV_ITEMS.map((group) => (
          <div key={group.group} style={{ marginBottom: "12px" }}>
            {!collapsed && (
              <p style={{ margin: "0 0 4px", padding: "0 10px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
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
        ))}
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
  );
}
