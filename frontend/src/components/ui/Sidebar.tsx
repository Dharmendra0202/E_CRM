import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  Check, BookOpen, GraduationCap, Target,
  Megaphone, BarChart3, Settings, Shield, FileText,
  ChevronLeft, ChevronRight, ChevronDown, Layers,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  userRole?: string;
}

// Role-based access map: which views each role can see
const ROLE_VIEWS: Record<string, string[]> = {
  ADMIN: ["*"], // all views
  SUPER_ADMIN: ["*"],
  TEACHER: ["dashboard", "attendance", "schedule", "homework", "exams", "examination", "marksheet", "leads", "batches", "communication"],
  STAFF: ["dashboard", "leads", "attendance", "billing", "communication"],
  STUDENT: ["dashboard", "schedule", "attendance", "exams", "marksheet", "homework"],
  PARENT: ["dashboard", "attendance", "exams", "marksheet", "billing", "communication"],
  ACCOUNTANT: ["dashboard", "billing", "reports"],
  PENDING: ["dashboard"],
};

const NAV_ITEMS = [
  { group: "Main", items: [
    { view: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { view: "admissions", icon: <Target size={18} />, label: "Enquiries" },
    { view: "new-enrollment", icon: <Layers size={18} />, label: "New Enrollment" },
  ]},
  { group: "People", items: [
    { view: "leads", icon: <Users2 size={18} />, label: "Students" },
    { view: "staff", icon: <Briefcase size={18} />, label: "Staff" },
    { view: "teachers", icon: <GraduationCap size={18} />, label: "Teachers" },
  ]},
  { group: "Academics", items: [
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
    { view: "billing", icon: <CreditCard size={18} />, label: "Fees & Payments" },
    { view: "communication", icon: <Megaphone size={18} />, label: "Notices" },
  ]},
  { group: "Settings", items: [
    { view: "reports", icon: <BarChart3 size={18} />, label: "Reports" },
    { view: "roles", icon: <Shield size={18} />, label: "Roles" },
    { view: "settings", icon: <Settings size={18} />, label: "Settings" },
  ]},
];

/* ── Animated drawer wrapper for each nav group ── */
function DrawerGroup({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(isOpen ? "auto" : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const firstRender = useRef(true);

  // Measure and animate
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Skip animation on first render — just set the right state
    if (firstRender.current) {
      firstRender.current = false;
      setHeight(isOpen ? "auto" : 0);
      return;
    }

    const scrollH = el.scrollHeight;

    if (isOpen) {
      // Opening: 0 → scrollHeight
      setHeight(0);
      setIsAnimating(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight; // force reflow
      requestAnimationFrame(() => {
        setHeight(scrollH);
      });
    } else {
      // Closing: auto → scrollHeight → 0
      // First, pin to the concrete pixel height
      setHeight(scrollH);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight; // force reflow so browser paints at scrollHeight
      // Use double-rAF to guarantee the browser has fully committed the scrollHeight
      // before we start animating down to 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          setHeight(0);
        });
      });
    }
  }, [isOpen]);

  const handleTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    // Only respond to the height transition on this exact element (ignore bubbled events)
    if (e.target !== e.currentTarget || e.propertyName !== "height") return;
    setIsAnimating(false);
    if (isOpen) {
      setHeight("auto"); // allow content to grow naturally once open
    }
  }, [isOpen]);

  return (
    <div
      ref={contentRef}
      onTransitionEnd={handleTransitionEnd}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        overflow: isAnimating || !isOpen ? "hidden" : "visible",
        transition: isAnimating ? "height 0.5s ease-in-out" : "none",
        willChange: isAnimating ? "height" : "auto",
      }}
    >
      {children}
    </div>
  );
}


export function Sidebar({ currentView, onNavigate, collapsed, onToggleCollapse, mobileOpen, onMobileClose, userRole = "ADMIN" }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Main", "People", "Academics"]));

  const toggleGroup = (group: string) => {
    const next = new Set(openGroups);
    if (next.has(group)) next.delete(group); else next.add(group);
    setOpenGroups(next);
  };

  // Filter NAV_ITEMS based on role
  const allowedViews = ROLE_VIEWS[userRole] || ROLE_VIEWS.STUDENT;
  const isAllowed = (view: string) => allowedViews.includes("*") || allowedViews.includes(view);
  
  const filteredNavItems = NAV_ITEMS.map(group => ({
    ...group,
    items: group.items.filter(item => isAllowed(item.view)),
  })).filter(group => group.items.length > 0);

  // Auto-expand the group that contains the active view (only when navigation changes)
  const prevView = useRef(currentView);
  useEffect(() => {
    if (prevView.current !== currentView) {
      prevView.current = currentView;
      const activeGroup = filteredNavItems.find(g => g.items.some(i => i.view === currentView))?.group;
      if (activeGroup && !openGroups.has(activeGroup)) {
        setOpenGroups(prev => new Set([...prev, activeGroup]));
      }
    }
  }, [currentView]);


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
      <div style={{ height: "60px", minHeight: "60px", maxHeight: "60px", boxSizing: "border-box", padding: collapsed ? "0 16px" : "0 18px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-glass)", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <GraduationCap size={16} color="#fff" />
        </div>
        {!collapsed && <span style={{ fontSize: "15px", fontWeight: 800, fontFamily: "var(--font-headings)", whiteSpace: "nowrap" }} className="text-gradient-indigo">EduFlow</span>}
      </div>

      {/* Nav Groups - Scrollable */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 8px", minHeight: 0 }}>
        {filteredNavItems.map((group) => {
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
                <ChevronDown
                  size={12}
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.5s ease-in-out",
                  }}
                />
              </button>
            )}

            {/* Animated drawer container */}
            {collapsed ? (
              /* When collapsed, show all items without animation */
              group.items.map((item) => {
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
                      padding: "10px 12px",
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
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "hsla(285,30%,20%,0.04)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
                  </button>
                );
              })
            ) : (
              <DrawerGroup isOpen={isOpen}>
                {group.items.map((item, idx) => {
                  const isActive = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => { onNavigate(item.view); if (onMobileClose) onMobileClose(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "8px 12px",
                        margin: "2px 0",
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? "var(--color-accent)" : "var(--text-secondary)",
                        background: isActive ? "hsla(328,100%,54%,0.08)" : "transparent",
                        transition: "all 0.2s ease, opacity 0.45s ease-in-out, transform 0.45s ease-in-out",
                        transitionDelay: isOpen ? `${idx * 0.04}s` : "0s",
                        textAlign: "left",
                        justifyContent: "flex-start",
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "translateY(0)" : "translateY(-8px)",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "hsla(285,30%,20%,0.04)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                    </button>
                  );
                })}
              </DrawerGroup>
            )}
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
