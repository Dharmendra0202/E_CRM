import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  Check, BookOpen, GraduationCap, Target,
  Megaphone, BarChart3, Settings, Shield, FileText,
  ChevronDown, Layers, Video,
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
  TEACHER: ["dashboard", "attendance", "online-classes", "class-attendance", "class-timetable", "attendance-details", "schedule", "homework", "exams", "examination", "marksheet", "leads", "student-profiles", "batches", "communication"],
  STAFF: ["dashboard", "leads", "student-profiles", "attendance", "online-classes", "class-attendance", "class-timetable", "attendance-details", "billing", "fee-receipt", "communication"],
  STUDENT: ["dashboard", "schedule", "attendance", "online-classes", "class-attendance", "class-timetable", "attendance-details", "examination", "marksheet", "fee-receipt"],
  PARENT: ["dashboard", "attendance", "examination", "marksheet", "billing", "fee-receipt", "communication"],
  ACCOUNTANT: ["dashboard", "billing", "reports"],
  PENDING: ["dashboard"],
};

const NAV_ITEMS = [
  { group: "Main", items: [
    { view: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { view: "admissions", icon: <Target size={18} />, label: "Enquiries" },
    { view: "new-enrollment", icon: <Layers size={18} />, label: "New Enrollment" },
    { view: "batches", icon: <Layers size={18} />, label: "Batches" },
  ]},
  { group: "Profiles", items: [
    { view: "student-profiles", icon: <Users2 size={18} />, label: "Students Profile" },
    { view: "staff", icon: <Briefcase size={18} />, label: "Staff" },
    { view: "teachers", icon: <GraduationCap size={18} />, label: "Teachers" },
  ]},
  { group: "Attendance", items: [
    { view: "online-classes", icon: <Video size={18} />, label: "Online Classes" },
    { view: "class-attendance", icon: <Check size={18} />, label: "Class Attendance" },
    { view: "class-timetable", icon: <CalendarDays size={18} />, label: "Class Time Table" },
    { view: "attendance-details", icon: <FileText size={18} />, label: "Attendance Datewise Details" },
  ]},
  { group: "Examination", items: [
    { view: "examination", icon: <BookOpen size={18} />, label: "Examinations" },
    { view: "marksheet", icon: <BarChart3 size={18} />, label: "Marksheet" },
  ]},
  { group: "Fee Receipt", items: [
    { view: "fee-receipt", icon: <CreditCard size={18} />, label: "Fee Receipt" },
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Main"]));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => {
    const next = new Set(openGroups);
    if (next.has(group)) next.delete(group); else next.add(group);
    setOpenGroups(next);
  };

  const toggleItem = (view: string) => {
    const next = new Set(expandedItems);
    if (next.has(view)) next.delete(view); else next.add(view);
    setExpandedItems(next);
  };

  // Filter NAV_ITEMS based on role
  const allowedViews = ROLE_VIEWS[userRole] || ROLE_VIEWS.STUDENT;
  const isAllowed = (view: string) => allowedViews.includes("*") || allowedViews.includes(view);
  
  const filteredNavItems = NAV_ITEMS.map(group => ({
    ...group,
    items: group.items
      .map(item => {
        const children = (item as any).children as { view: string }[] | undefined;
        if (children?.length) {
          const allowedChildren = children.filter(c => isAllowed(c.view));
          // Keep parent only if it has at least one allowed child
          return allowedChildren.length ? { ...item, children: allowedChildren } : null;
        }
        return isAllowed(item.view) ? item : null;
      })
      .filter(Boolean) as typeof group.items,
  })).filter(group => group.items.length > 0);

  // Auto-expand the group (and parent item) that contains the active view
  const prevView = useRef(currentView);
  useEffect(() => {
    if (prevView.current !== currentView) {
      prevView.current = currentView;
      const activeGroup = filteredNavItems.find(g =>
        g.items.some(i => i.view === currentView || ((i as any).children || []).some((c: any) => c.view === currentView))
      )?.group;
      if (activeGroup && !openGroups.has(activeGroup)) {
        setOpenGroups(prev => new Set([...prev, activeGroup]));
      }
      // Expand parent item if a child is active
      for (const g of filteredNavItems) {
        for (const it of g.items) {
          const children = (it as any).children as any[] | undefined;
          if (children?.some(c => c.view === currentView)) {
            setExpandedItems(prev => new Set([...prev, it.view]));
          }
        }
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
      <div style={{ height: "65px", minHeight: "65px", maxHeight: "65px", boxSizing: "border-box", padding: collapsed ? "0 16px" : "0 18px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-glass)", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #007bff, #0069d9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <GraduationCap size={16} color="#fff" />
        </div>
        {!collapsed && <span style={{ fontSize: "16px", fontWeight: 800, fontFamily: "var(--font-headings)", whiteSpace: "nowrap" }} className="text-gradient-indigo">EduFlow</span>}
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
                  fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)",
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
                const children = (item as any).children as { view: string }[] | undefined;
                const isActive = currentView === item.view || (children || []).some(c => c.view === currentView);
                return (
                  <button
                    key={item.view}
                    onClick={() => {
                      const target = children?.length ? children[0].view : item.view;
                      onNavigate(target); if (onMobileClose) onMobileClose();
                    }}
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
                      fontSize: "14px",
                      fontWeight: isActive ? 700 : 600,
                      color: "var(--text-secondary)",
                      background: isActive ? "hsla(205,90%,55%,0.08)" : "transparent",
                      transition: "all 0.2s",
                      textAlign: "left",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "hsla(285,30%,20%,0.04)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ display: "flex", flexShrink: 0, color: "#007bff" }}>{item.icon}</span>
                  </button>
                );
              })
            ) : (
              <DrawerGroup isOpen={isOpen}>
                {group.items.map((item, idx) => {
                  const children = (item as any).children as { view: string; icon: React.ReactNode; label: string }[] | undefined;
                  const hasChildren = !!children?.length;
                  const isItemExpanded = expandedItems.has(item.view);
                  const isActive = currentView === item.view || (hasChildren && children!.some(c => c.view === currentView));
                  return (
                    <div key={item.view}>
                      <button
                        onClick={() => {
                          if (hasChildren) { toggleItem(item.view); }
                          else { onNavigate(item.view); if (onMobileClose) onMobileClose(); }
                        }}
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
                          fontSize: "14px",
                          fontWeight: isActive ? 700 : 600,
                          color: "var(--text-secondary)",
                          background: isActive ? "hsla(205,90%,55%,0.08)" : "transparent",
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
                        <span style={{ display: "flex", flexShrink: 0, color: "#007bff" }}>{item.icon}</span>
                        <span style={{ whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>
                        {hasChildren && (
                          <ChevronDown
                            size={12}
                            style={{
                              transform: isItemExpanded ? "rotate(180deg)" : "rotate(0)",
                              transition: "transform 0.3s ease",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>

                      {/* Sub-items */}
                      {hasChildren && (
                        <DrawerGroup isOpen={isItemExpanded}>
                          {children!.map((child) => {
                            const childActive = currentView === child.view;
                            return (
                              <button
                                key={child.view}
                                onClick={() => { onNavigate(child.view); if (onMobileClose) onMobileClose(); }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "9px",
                                  width: "100%",
                                  padding: "7px 12px 7px 28px",
                                  margin: "1px 0",
                                  borderRadius: "10px",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: childActive ? 700 : 500,
                                  color: "var(--text-secondary)",
                                  background: childActive ? "hsla(205,90%,55%,0.08)" : "transparent",
                                  transition: "all 0.2s ease",
                                  textAlign: "left",
                                  justifyContent: "flex-start",
                                }}
                                onMouseEnter={(e) => { if (!childActive) e.currentTarget.style.background = "hsla(285,30%,20%,0.04)"; }}
                                onMouseLeave={(e) => { if (!childActive) e.currentTarget.style.background = "transparent"; }}
                              >
                                <span style={{ display: "flex", flexShrink: 0, color: "#007bff", opacity: 0.85 }}>{child.icon}</span>
                                <span style={{ whiteSpace: "nowrap" }}>{child.label}</span>
                              </button>
                            );
                          })}
                        </DrawerGroup>
                      )}
                    </div>
                  );
                })}
              </DrawerGroup>
            )}
          </div>
          );
        })}
      </div>

    </aside>
    </>
  );
}
