import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { Skeleton } from "./components/ui/Skeleton";
import { Toggle } from "./components/ui/Toggle";
import { api, setToken, getToken } from "./utils/api";
import { Login } from "./components/Login";
import { StudentManagement } from "./components/StudentManagement";
import { TimetableScheduler } from "./components/TimetableScheduler";
import { HistoryModal } from "./components/HistoryModal";
import { AttendanceTracker } from "./components/AttendanceTracker";
import { ExamsManagement } from "./components/ExamsManagement";
import { AppsMenuDrawer } from "./components/ui/AppsMenuDrawer";
import {
  Search, User, Plus, Check, GraduationCap, DollarSign, TrendingUp,
  Menu, X, LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  ExternalLink, Filter, Settings, LogOut, ShieldCheck, Bell, Sparkles,
  Activity, BookOpen, AlertCircle, ArrowUpRight, Clock, UserCheck,
  BarChart3, IndianRupee, CheckCircle2, XCircle, Target, Zap, History
} from "lucide-react";

type ViewType = "dashboard" | "leads" | "schedule" | "billing" | "staff" | "attendance" | "exams";
type StaffRoleType = "ALL" | "ADMIN" | "TEACHER" | "SALES" | "BILLING" | "SUPPORT";

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchCard, setGlobalSearchCard] = useState<any>(null);
  const [isCardClosing, setIsCardClosing] = useState(false);

  const closeCard = () => {
    setIsCardClosing(true);
    setTimeout(() => {
      setGlobalSearchCard(null);
      setIsCardClosing(false);
    }, 1200);
  };
  const [activeStaffFilter, setActiveStaffFilter] = useState<StaffRoleType>("ALL");
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [studentTab, setStudentTab] = useState<"all" | "add" | "search" | "progress">("all");

  const fetchDashboardStudents = async () => {
    try {
      const res = await api.students.getAll();
      if (res.data) setLeadsList(res.data.map((s: any) => ({
        id: s.id,
        name: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.parentName,
        email: s.user?.email || s.parentEmail,
        phone: s.user?.phone || s.parentPhone,
        status: s.enrollments?.[0]?.status === "ACTIVE" ? "ENROLLED" : "NEW",
        source: s.enrollments?.[0]?.batch?.name || "Not Enrolled",
        createdAt: s.createdAt,
      })));
      else setLeadsList([]);
    } catch { setLeadsList([]); }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.invoices.getAll();
      if (res.data) setInvoicesList(res.data);
      else setInvoicesList([]);
    } catch { setInvoicesList([]); }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.attendance.getAll();
      if (res.data) setAttendanceList(res.data);
      else setAttendanceList([]);
    } catch { setAttendanceList([]); }
  };


  const fetchStaff = async () => {
    try {
      const res = await api.staff.getAll();
      if (res.data?.length > 0) {
        setStaffList(res.data.map((s: any) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          initials: `${s.firstName[0]}${s.lastName[0]}`.toUpperCase(),
          role: s.role,
          title: s.teacher?.qualification || s.role,
          email: s.email,
          phone: s.phone || "",
          status: "Online",
          assignment: s.teacher?.bio || "—",
        })));
      } else {
        setStaffList([]);
      }
    } catch {
      setStaffList([]);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    // Optimistic update
    setLeadsList(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await api.leads.update(leadId, { status: newStatus });
    } catch { /* revert not needed for UX */ }
  };

  useEffect(() => {
    // Check for existing JWT token on mount
    const token = getToken();
    if (token) {
      try {
        // Decode JWT payload to get user info (no verification needed client-side)
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUserProfile({
            id: payload.id,
            email: payload.email,
            user_metadata: { name: payload.email?.split("@")[0] || "Admin", role: payload.role },
          });
        } else {
          setToken(null); // expired
        }
      } catch {
        setToken(null);
      }
    }
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardStudents();
      fetchStaff();
      fetchInvoices();
      fetchAttendance();
    }
  }, [userProfile, currentView]);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, [currentView]);

  const filteredStaff = activeStaffFilter === "ALL" ? staffList : staffList.filter(s => s.role === activeStaffFilter);
  const userInitials = userProfile?.user_metadata?.name
    ? userProfile.user_metadata.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : userProfile?.email ? userProfile.email.substring(0, 2).toUpperCase() : "DA";
  const userName = userProfile?.user_metadata?.name || userProfile?.email?.split("@")[0] || "Dharmendra";
  const userRole = userProfile?.user_metadata?.role || "Super Administrator";

  if (!userProfile) return <Login onLoginSuccess={(u) => setUserProfile(u)} />;

  // ── Derived stats from student list ───────────────────────
  const totalLeads = leadsList.length;
  const newLeads = leadsList.filter(l => l.status === "NEW").length;
  const enrolledLeads = leadsList.filter(l => l.status === "ENROLLED").length;
  const lostLeads = leadsList.filter(l => l.status === "LOST").length;

  const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    NEW:            { label: "New",            color: "var(--color-info)",    bg: "hsla(200,95%,50%,0.1)" },
    CONTACTED:      { label: "Contacted",      color: "var(--color-warning)", bg: "hsla(38,92%,50%,0.1)" },
    DEMO_SCHEDULED: { label: "Demo Scheduled", color: "hsl(271,91%,60%)",     bg: "hsla(271,91%,60%,0.1)" },
    ENROLLED:       { label: "Enrolled",       color: "var(--color-success)", bg: "hsla(142,70%,45%,0.1)" },
    LOST:           { label: "Lost",           color: "var(--color-danger)",  bg: "hsla(342,90%,48%,0.1)" },
    DEMO:           { label: "Demo",           color: "hsl(271,91%,60%)",     bg: "hsla(271,91%,60%,0.1)" },
  };

  const ROLE_META: Record<string, { color: string; bg: string }> = {
    ADMIN:   { color: "hsl(38,92%,50%)",    bg: "hsla(38,92%,50%,0.1)" },
    TEACHER: { color: "var(--color-success)", bg: "hsla(142,70%,45%,0.1)" },
    SALES:   { color: "var(--color-accent)",  bg: "hsla(328,100%,54%,0.1)" },
    BILLING: { color: "hsl(38,92%,45%)",    bg: "hsla(38,92%,45%,0.1)" },
    SUPPORT: { color: "var(--color-info)",    bg: "hsla(200,95%,50%,0.1)" },
  };

  const STATUS_ONLINE: Record<string, string> = {
    Online: "var(--color-success)", "In Class": "var(--color-accent)",
    "On Break": "var(--color-warning)", Offline: "var(--text-secondary)",
  };

  return (
    <div className="crm-container relative overflow-hidden">
      <div className="radial-spotlight" />

      {/* ── Bottom Dock ── */}
      <nav className="crm-bottom-dock">
        {([
          { view: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
          { view: "leads",     icon: <Users2 size={20} />,          label: "Students" },
          { view: "schedule",  icon: <CalendarDays size={20} />,    label: "Timetable" },
          { view: "attendance",icon: <Check size={20} />,           label: "Attendance" },
          { view: "billing",   icon: <CreditCard size={20} />,      label: "Billing" },
          { view: "staff",     icon: <Briefcase size={20} />,       label: "Staff" },
        ] as { view: ViewType; icon: React.ReactNode; label: string }[]).map(({ view, icon, label }) => (
          <button key={view} className={`crm-dock-item ${currentView === view ? "is-active" : ""}`} onClick={() => { setCurrentView(view); if (view === "leads") setStudentTab("all"); }}>
            {icon}
            <span className="crm-dock-tooltip">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <div className="crm-main-content">
        {/* ── Header ── */}
        <header className="crm-top-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <GraduationCap size={26} style={{ color: "var(--color-accent)" }} />
            <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0 }} className="text-gradient-indigo">E-CRM Portal</h2>
            <span className="navbar-logo-badge">PRO</span>
          </div>

          <div className="navbar-search-box" style={{ display: "flex", width: "300px", position: "relative" }}>
            <Search size={15} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search student by name..."
              className="navbar-search-input"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") setGlobalSearch("");
                if (e.key === "Enter") {
                  const q = globalSearch.toLowerCase().trim();
                  const hits = leadsList.filter(s => s.name?.toLowerCase().startsWith(q));
                  if (hits.length === 1) {
                    setGlobalSearchCard(hits[0]);
                    setGlobalSearch("");
                  }
                }
              }}
              onBlur={() => setTimeout(() => setGlobalSearch(""), 200)}
              autoComplete="off"
            />
            {/* Live suggestions dropdown */}
            {globalSearch.trim().length > 0 && (() => {
              const q = globalSearch.toLowerCase().trim();
              const hits = leadsList.filter(s => s.name?.toLowerCase().startsWith(q));
              if (hits.length === 0) return (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                  background: "#fff", borderRadius: "14px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 99999,
                  border: "1px solid hsla(285,30%,20%,0.08)", overflow: "hidden"
                }}>
                  <div style={{ padding: "14px 16px", fontSize: "12px", color: "hsl(285,20%,55%)", textAlign: "center" }}>
                    No student found for <strong>"{globalSearch}"</strong>
                  </div>
                </div>
              );
              return (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                  background: "#fff", borderRadius: "14px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 99999,
                  border: "1px solid hsla(285,30%,20%,0.08)", overflow: "hidden"
                }}>
                  <div style={{ padding: "8px 14px 5px", fontSize: "9px", fontWeight: 800, color: "hsl(285,20%,55%)", textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: "1px solid hsla(285,30%,20%,0.06)" }}>
                    {hits.length} student{hits.length !== 1 ? "s" : ""} found
                  </div>
                  {hits.slice(0, 10).map(s => {
                    const initials = s.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "??";
                    return (
                      <div
                        key={s.id}
                        onMouseDown={() => {
                          setGlobalSearchCard(s);
                          setGlobalSearch("");
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 14px", cursor: "pointer",
                          borderBottom: "1px solid hsla(285,30%,20%,0.04)",
                          transition: "background 0.15s"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "hsla(271,91%,60%,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{
                          width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
                          background: "linear-gradient(135deg,hsl(271,91%,60%),hsl(328,100%,54%))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 900, color: "#fff"
                        }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(285,50%,12%)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {/* Highlight matching prefix */}
                            <span style={{ color: "hsl(328,100%,48%)", fontWeight: 900 }}>{s.name?.substring(0, globalSearch.length)}</span>
                            <span>{s.name?.substring(globalSearch.length)}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "hsl(285,20%,55%)", marginTop: "1px" }}>{s.source || "Not Enrolled"} · {s.phone || s.email || ""}</div>
                        </div>
                        <span style={{
                          fontSize: "9px", fontWeight: 800, padding: "3px 8px", borderRadius: "8px",
                          background: s.status === "ENROLLED" ? "hsla(142,70%,40%,0.1)" : "hsla(285,30%,20%,0.07)",
                          color: s.status === "ENROLLED" ? "hsl(142,70%,35%)" : "hsl(285,20%,45%)", flexShrink: 0
                        }}>{s.status}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AppsMenuDrawer onNavigate={(view) => { setCurrentView(view as ViewType); if (view === "leads") setStudentTab("all"); }} currentView={currentView} />
            <Button
              variant="ghost"
              title="Activity History"
              onClick={() => setIsHistoryOpen(true)}
              style={{ position: "relative", width: "36px", height: "36px", padding: 0, borderRadius: "50%" }}
            >
              <History size={17} />
            </Button>
            <Button variant="ghost" style={{ position: "relative", width: "36px", height: "36px", padding: 0, borderRadius: "50%" }}>
              <Bell size={17} />
              <span className="navbar-bell-ping" /><span className="navbar-bell-ping-ring" />
            </Button>

            <div className="profile-dropdown-container">
              <button className="navbar-profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <div className="navbar-avatar-circle">{userInitials}</div>
              </button>
              {isProfileOpen && (
                <div className="navbar-profile-dropdown">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{userName}</div>
                    <div className="dropdown-user-role">{userRole}</div>
                  </div>
                  <button className="dropdown-item" onClick={() => setIsProfileOpen(false)}><Settings size={14} /><span>Settings</span></button>
                  <button className="dropdown-item" onClick={() => setIsProfileOpen(false)}><ShieldCheck size={14} /><span>Security</span></button>
                  <hr style={{ border: 0, borderTop: "1px solid var(--border-glass)", margin: "4px 0" }} />
                  <button className="dropdown-item dropdown-item-danger" onClick={() => { setIsProfileOpen(false); setToken(null); setUserProfile(null); setSession(null); }}>
                    <LogOut size={14} /><span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

            <div className="navbar-mobile-toggle">
              <Button variant={isMenuOpen ? "primary" : "secondary"} onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ width: "36px", height: "36px", padding: 0 }}>
                {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>
            </div>
          </div>

          <nav className={`top-drawer ${isMenuOpen ? "is-open" : ""}`} style={{ top: "68px" }}>
            <div className="drawer-content-grid">
              {([
                { view: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
                { view: "leads",     icon: <Users2 size={18} />,          label: "Students" },
                { view: "schedule",  icon: <CalendarDays size={18} />,    label: "Timetable" },
                { view: "attendance",icon: <Check size={18} />,           label: "Attendance" },
                { view: "billing",   icon: <CreditCard size={18} />,      label: "Billing" },
                { view: "staff",     icon: <Briefcase size={18} />,       label: "Staff" },
              ] as { view: ViewType; icon: React.ReactNode; label: string }[]).map(({ view, icon, label }) => (
                <button key={view} className={`drawer-nav-item ${currentView === view ? "is-active" : ""}`}
                  onClick={() => { setCurrentView(view); setIsMenuOpen(false); }}>
                  <div className="drawer-icon-box">{icon}</div>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </header>

        {/* ── Viewport ── */}
        <div className="crm-viewport">

          {/* ══════════════ DASHBOARD VIEW ══════════════ */}
          {currentView === "dashboard" && (
            <div className="animate-fade-in">

              {/* ── Hero Welcome Banner ── */}
              <div style={{
                background: "linear-gradient(135deg, hsl(328,100%,54%) 0%, hsl(271,91%,60%) 55%, hsl(240,80%,65%) 100%)",
                borderRadius: "20px", padding: "28px 32px", marginBottom: "24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: "0 16px 48px -8px hsla(328,100%,54%,0.35)", overflow: "hidden", position: "relative"
              }}>
                <div style={{ position: "absolute", top: "-40px", right: "200px", width: "180px", height: "180px", borderRadius: "50%", background: "hsla(0,0%,100%,0.07)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-50px", right: "60px", width: "140px", height: "140px", borderRadius: "50%", background: "hsla(0,0%,100%,0.05)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: "11px", color: "hsla(0,0%,100%,0.7)", fontWeight: 700, margin: "0 0 6px", letterSpacing: "1px", textTransform: "uppercase" }}>Monday, 20 July 2026</p>
                  <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "#fff" }}>Welcome back, {userName.split(" ")[0]} 👋</h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "hsla(0,0%,100%,0.72)" }}>Here's what's happening at your academy today.</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexShrink: 0, position: "relative", zIndex: 1 }}>
                  <button onClick={() => { setCurrentView("leads"); setStudentTab("add"); }} style={{ background: "hsla(0,0%,100%,0.18)", border: "1px solid hsla(0,0%,100%,0.3)", borderRadius: "12px", padding: "10px 16px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s", backdropFilter: "blur(8px)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "hsla(0,0%,100%,0.28)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "hsla(0,0%,100%,0.18)")}>
                    <Plus size={14} /> Add Student
                  </button>
                  <button onClick={() => setCurrentView("attendance")} style={{ background: "#fff", border: "none", borderRadius: "12px", padding: "10px 16px", color: "hsl(328,100%,50%)", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", transition: "transform 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
                    <Check size={14} /> Take Attendance
                  </button>
                </div>
              </div>

              {/* ── KPI Metric Cards ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {(() => {
                  const studentsThisMonth = leadsList.filter(s => {
                    const d = new Date(s.createdAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length;
                  const totalFeesCollected = invoicesList.reduce((sum, inv) => {
                    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
                    return sum + paid;
                  }, 0);
                  const totalBilled = invoicesList.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
                  const collectionRate = totalBilled > 0 ? Math.round((totalFeesCollected / totalBilled) * 100) : 0;
                  const avgAttendance = attendanceList.length > 0
                    ? (attendanceList.filter(a => a.status === "PRESENT" || a.status === "LATE").length / attendanceList.length) * 100
                    : 0;

                  return [
                    { icon: <Users2 size={22} />, grad: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", label: "Total Students", value: String(leadsList.length), badge: `+${studentsThisMonth} this month` },
                    { icon: <IndianRupee size={22} />, grad: "linear-gradient(135deg,hsl(142,70%,42%),hsl(160,70%,35%))", label: "Fees Collected", value: `₹${totalFeesCollected.toLocaleString("en-IN")}`, badge: `${collectionRate}% of target` },
                    { icon: <UserCheck size={22} />, grad: "linear-gradient(135deg,hsl(271,91%,60%),hsl(240,80%,65%))", label: "Avg Attendance", value: `${avgAttendance.toFixed(1)}%`, badge: `${attendanceList.length} records` },
                    { icon: <Target size={22} />, grad: "linear-gradient(135deg,hsl(38,92%,50%),hsl(20,95%,55%))", label: "Enrolled Students", value: String(enrolledLeads), badge: `${newLeads} new today` },
                  ];
                })().map((m, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "22px 20px", border: "1px solid hsla(285,30%,20%,0.07)", boxShadow: "0 2px 16px -4px rgba(29,10,39,0.08)", transition: "all 0.3s ease", cursor: "default" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 16px 40px -8px rgba(29,10,39,0.15)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "0 2px 16px -4px rgba(29,10,39,0.08)"; }}>
                    {isLoading ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Skeleton variant="circle" width={44} height={44} />
                        <Skeleton variant="text" width="55%" />
                        <Skeleton variant="text" width="40%" height={30} />
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                          <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: m.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 6px 16px rgba(0,0,0,0.18)" }}>{m.icon}</div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,42%,0.1)", padding: "3px 9px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <TrendingUp size={10} />{m.badge}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px" }}>{m.label}</p>
                        <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-headings)" }}>{m.value}</h2>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Main 2-col grid ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px", marginBottom: "16px" }}>
                {/* Recent Leads */}
                <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid hsla(285,30%,20%,0.07)", boxShadow: "0 2px 16px -4px rgba(29,10,39,0.06)", overflow: "hidden" }}>
                  <div style={{ padding: "16px 22px", borderBottom: "1px solid hsla(285,30%,20%,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Recent Students</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>Latest registered students</p>
                    </div>
                    <button onClick={() => setCurrentView("leads")} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.07)", border: "1px solid hsla(328,100%,54%,0.18)", borderRadius: "8px", padding: "5px 11px", cursor: "pointer" }}>
                      View All <ArrowUpRight size={12} />
                    </button>
                  </div>
                  {isLoading ? (
                    <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={48} />)}
                    </div>
                  ) : leadsList.slice(0, 5).map((lead, idx) => {
                    const meta = STATUS_META[lead.status] || STATUS_META["NEW"];
                    return (
                      <div key={lead.id} style={{ display: "flex", alignItems: "center", padding: "12px 22px", borderBottom: idx < 4 ? "1px solid hsla(285,30%,20%,0.05)" : "none", gap: "12px", transition: "background 0.15s" }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "hsla(328,100%,54%,0.02)")}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg,${meta.color}22,${meta.color}44)`, border: `1.5px solid ${meta.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: meta.color, flexShrink: 0 }}>
                          {lead.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{lead.source} · {lead.phone}</p>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}25`, padding: "3px 9px", borderRadius: "20px", flexShrink: 0 }}>{meta.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Quick Actions */}
                  <div style={{ background: "#fff", borderRadius: "16px", padding: "18px", border: "1px solid hsla(285,30%,20%,0.07)", boxShadow: "0 2px 16px -4px rgba(29,10,39,0.06)" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Zap size={12} color="#fff" /></span>
                      Quick Actions
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      {[
                        { label: "Add New Student",  icon: <Plus size={13} />,         action: () => { setCurrentView("leads"); setStudentTab("add"); },        color: "hsl(328,100%,54%)" },
                        { label: "Mark Attendance",  icon: <CheckCircle2 size={13} />, action: () => setCurrentView("attendance"), color: "hsl(142,70%,42%)" },
                        { label: "Issue Invoice",    icon: <IndianRupee size={13} />,  action: () => setCurrentView("billing"),    color: "hsl(38,92%,50%)" },
                        { label: "Schedule Class",   icon: <CalendarDays size={13} />, action: () => setCurrentView("schedule"),   color: "hsl(271,91%,60%)" },
                      ].map(a => (
                        <button key={a.label} onClick={a.action}
                          style={{ display: "flex", alignItems: "center", gap: "9px", padding: "9px 11px", background: `${a.color}08`, border: `1px solid ${a.color}1a`, borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", transition: "all 0.2s", textAlign: "left", width: "100%" }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.color}14`; el.style.transform = "translateX(3px)"; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.color}08`; el.style.transform = "none"; }}>
                          <span style={{ color: a.color, display: "flex" }}>{a.icon}</span>{a.label}
                          <ArrowUpRight size={11} style={{ marginLeft: "auto", opacity: 0.35 }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pending Alerts */}
                  <div style={{ background: "#fff", borderRadius: "16px", padding: "18px", border: "1px solid hsla(285,30%,20%,0.07)", boxShadow: "0 2px 16px -4px rgba(29,10,39,0.06)" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg,hsl(38,92%,50%),hsl(20,95%,55%))", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><AlertCircle size={12} color="#fff" /></span>
                      Pending Alerts
                    </h3>
                    {[
                      { msg: "3 invoices overdue",         color: "var(--color-danger)", icon: <XCircle size={13} />,  bg: "hsla(342,90%,48%,0.07)" },
                      { msg: "Demo class at 3 PM today",   color: "hsl(271,91%,60%)",    icon: <Clock size={13} />,    bg: "hsla(271,91%,60%,0.07)" },
                      { msg: `${newLeads} leads uncontacted`, color: "hsl(200,95%,50%)", icon: <Users2 size={13} />,   bg: "hsla(200,95%,50%,0.07)" },
                    ].map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "9px", padding: "9px 10px", marginBottom: i < 2 ? "6px" : 0, background: a.bg, borderRadius: "9px" }}>
                        <span style={{ color: a.color, flexShrink: 0, display: "flex" }}>{a.icon}</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{a.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Pipeline Summary ── */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "20px 22px", border: "1px solid hsla(285,30%,20%,0.07)", boxShadow: "0 2px 16px -4px rgba(29,10,39,0.06)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
                  <BarChart3 size={16} style={{ color: "var(--color-accent)" }} /> Lead Pipeline Overview
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
                  {Object.entries(STATUS_META).filter(([s]) => s !== "DEMO").map(([status, meta]) => {
                    const count = leadsList.filter(l => l.status === status).length;
                    const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                    return (
                      <div key={status} style={{ padding: "14px", background: meta.bg, borderRadius: "12px", border: `1px solid ${meta.color}1a` }}>
                        <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 800, color: meta.color, textTransform: "uppercase", letterSpacing: "0.7px" }}>{meta.label}</p>
                        <h3 style={{ margin: "0 0 8px", fontSize: "26px", fontWeight: 800 }}>{count}</h3>
                        <div style={{ height: "3px", background: `${meta.color}20`, borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: meta.color, borderRadius: "2px" }} />
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>{pct}% of total</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ STUDENTS VIEW ══════════════ */}
          {currentView === "leads" && (
            <div className="animate-fade-in">
              <StudentManagement initialTab={studentTab} />
            </div>
          )}

          {/* ══════════════ TIMETABLE VIEW ══════════════ */}
          {currentView === "schedule" && (
            <div className="animate-fade-in">
              <TimetableScheduler />
            </div>
          )}

          {/* ══════════════ ATTENDANCE VIEW ══════════════ */}
          {currentView === "attendance" && <AttendanceTracker />}

          {/* ══════════════ EXAMS VIEW ══════════════ */}
          {currentView === "exams" && (
            <div className="animate-fade-in">
              <ExamsManagement />
            </div>
          )}


          {/* ══════════════ BILLING VIEW ══════════════ */}
          {currentView === "billing" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                  <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Billing & Fee Ledger</h1>
                  <p>Manage invoices, Stripe payments, and outstanding dues.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Button variant="secondary" leftIcon={<Filter size={14} />}>Filter</Button>
                  <Button variant="primary" leftIcon={<Plus size={14} />}>Issue Invoice</Button>
                </div>
              </div>

              {/* Summary strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {(() => {
                  const totalBilled = invoicesList.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
                  const totalFeesCollected = invoicesList.reduce((sum, inv) => {
                    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
                    return sum + paid;
                  }, 0);
                  const outstanding = totalBilled - totalFeesCollected;

                  return [
                    { label: "Total Billed", value: `₹${totalBilled.toLocaleString("en-IN")}`, color: "var(--color-accent)", bg: "hsla(328,100%,54%,0.08)" },
                    { label: "Collected", value: `₹${totalFeesCollected.toLocaleString("en-IN")}`, color: "var(--color-success)", bg: "hsla(142,70%,40%,0.08)" },
                    { label: "Outstanding", value: `₹${outstanding.toLocaleString("en-IN")}`, color: "var(--color-danger)", bg: "hsla(342,90%,48%,0.08)" },
                  ];
                })().map(s => (
                  <div key={s.label} style={{ padding: "16px 20px", background: s.bg, borderRadius: "12px", border: `1px solid ${s.color}22` }}>
                    <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>{s.label}</p>
                    <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</h3>
                  </div>
                ))}
              </div>

              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[1,2,3].map(i => <Skeleton key={i} variant="rect" height={72} />)}
                </div>
              ) : (
                <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", padding: "12px 24px", background: "rgba(29,10,39,0.03)", borderBottom: "1px solid var(--border-glass)", fontWeight: 700, fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", gap: "16px" }}>
                    <div>Student / Period</div><div>Amount</div><div>Status</div><div>Action</div>
                  </div>
                  {invoicesList.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>No invoices found in the system.</div>
                  ) : invoicesList.map(inv => {
                    const studentName = inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : (inv.student?.parentName || "Student");
                    const period = `Due: ${new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
                    const amount = `₹${Number(inv.totalAmount).toLocaleString("en-IN")}`;
                    const statusMap: Record<string, { color: string; bg: string; label: string }> = {
                      PAID:    { color: "var(--color-success)", bg: "hsla(142,70%,40%,0.1)", label: "Paid" },
                      UNPAID:  { color: "var(--color-danger)",  bg: "hsla(342,90%,48%,0.1)", label: "Unpaid" },
                      PARTIAL: { color: "hsl(38,92%,50%)",      bg: "hsla(38,92%,50%,0.1)",  label: "Partial" },
                    };
                    const s = statusMap[inv.status] || { color: "var(--text-secondary)", bg: "rgba(0,0,0,0.05)", label: inv.status };
                    return (
                      <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", padding: "16px 24px", borderBottom: "1px solid var(--border-glass)", alignItems: "center", gap: "16px" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 650 }}>{studentName}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>#{inv.id.substring(0, 8)} • {period}</p>
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: 700 }}>{amount}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: s.color, background: s.bg, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>{s.label}</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {inv.status !== "PAID" && <Button variant="primary" size="sm">Pay Now</Button>}
                          <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={13} />}>PDF</Button>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          )}

          {/* ══════════════ STAFF VIEW ══════════════ */}
          {currentView === "staff" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                  <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Staff & Roles Directory</h1>
                  <p>Manage academic, admin, sales, billing, and support rosters.</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={14} />}>Register Staff</Button>
              </div>

              <div className="staff-layout-grid">
                {/* Sidebar */}
                <Card style={{ padding: "16px", gap: "6px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Filter size={13} /> Departments
                  </p>
                  {([
                    { key: "ALL",     icon: <Activity size={14} />,      label: "All Staff",    count: staffList.length },
                    { key: "ADMIN",   icon: <Sparkles size={14} />,      label: "Admin",        count: staffList.filter(s => s.role === "ADMIN").length },
                    { key: "TEACHER", icon: <GraduationCap size={14} />, label: "Teachers",     count: staffList.filter(s => s.role === "TEACHER").length },
                    { key: "SALES",   icon: <Users2 size={14} />,        label: "Sales",        count: staffList.filter(s => s.role === "SALES").length },
                    { key: "BILLING", icon: <IndianRupee size={14} />,   label: "Billing",      count: staffList.filter(s => s.role === "BILLING").length },
                    { key: "SUPPORT", icon: <BookOpen size={14} />,      label: "Support",      count: staffList.filter(s => s.role === "SUPPORT").length },
                  ] as { key: StaffRoleType; icon: React.ReactNode; label: string; count: number }[]).map(f => (
                    <button key={f.key} className={`staff-filter-btn ${activeStaffFilter === f.key ? "is-active" : ""}`}
                      onClick={() => setActiveStaffFilter(f.key)}>
                      {f.icon}
                      <span style={{ flex: 1 }}>{f.label}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, opacity: 0.6 }}>{f.count}</span>
                    </button>
                  ))}
                </Card>

                {/* Staff Cards Grid */}
                <div>
                  {isLoading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      {[1,2,3].map(i => <Skeleton key={i} variant="rect" height={180} />)}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      {filteredStaff.map(staff => {
                        const rm = ROLE_META[staff.role] || { color: "var(--text-secondary)", bg: "rgba(0,0,0,0.05)" };
                        const onlineColor = STATUS_ONLINE[staff.status] || "var(--text-secondary)";
                        return (
                          <Card key={staff.id} hoverLift style={{ padding: "20px", gap: 0 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                              <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: rm.bg, border: `2px solid ${rm.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: rm.color, flexShrink: 0 }}>
                                {staff.initials}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{staff.name}</p>
                                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{staff.title}</p>
                              </div>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: rm.color, background: rm.bg, padding: "3px 8px", borderRadius: "20px", flexShrink: 0 }}>{staff.role}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <TrendingUp size={12} />{staff.assignment}
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: onlineColor, flexShrink: 0 }} />
                                <span style={{ color: onlineColor, fontWeight: 600 }}>{staff.status}</span>
                                <span style={{ marginLeft: "auto" }}>{staff.phone}</span>
                              </span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>{/* end crm-viewport */}
      </div>{/* end crm-main-content */}

      {/* ── STUDENT ID CARD MODAL (macOS Genie animation) ────────────── */}
      {globalSearchCard && (() => {
        const s = globalSearchCard;
        const initials = s.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "??";
        const isEnrolled = s.status === "ENROLLED";
        return (
          <div
            onClick={closeCard}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(10,4,22,0.65)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 99998, padding: "16px",
              animation: isCardClosing
                ? "genieBackdropOut 1.2s ease forwards"
                : "genieBackdropIn 0.9s ease forwards"
            }}
          >
            {/* ID Card */}
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "380px",
                boxShadow: "0 32px 80px rgba(0,0,0,0.32)", overflow: "hidden",
                border: "1px solid hsla(285,30%,20%,0.08)",
                transformOrigin: "top center",
                animation: isCardClosing
                  ? "genieOut 1.2s cubic-bezier(0.4, 0, 0.6, 1) forwards"
                  : "genieIn 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
              }}
            >
              {/* Card Header */}
              <div style={{
                background: "linear-gradient(135deg, hsl(271,91%,44%) 0%, hsl(328,100%,48%) 100%)",
                padding: "28px 24px 60px", position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-60px", left: "-20px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
                {/* X Button */}
                <button
                  onClick={closeCard}
                  style={{
                    position: "absolute", top: "14px", right: "14px",
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: "16px", lineHeight: 1, transition: "background 0.2s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                >✕</button>
                {/* School label */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "1px" }}>E-CRM Academy</span>
                  <span style={{ fontSize: "9px", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 7px", borderRadius: "10px", fontWeight: 800 }}>STUDENT ID</span>
                </div>
                {/* Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "20px",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.1))",
                    border: "2.5px solid rgba(255,255,255,0.4)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "24px", fontWeight: 900, color: "#fff",
                    boxShadow: "0 6px 24px rgba(0,0,0,0.18)", flexShrink: 0,
                    backdropFilter: "blur(6px)", userSelect: "none"
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: "4px" }}>{s.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{s.source || "Not Enrolled"}</div>
                  </div>
                </div>
              </div>

              {/* Status chip (overlapping) */}
              <div style={{ margin: "-18px 24px 0", display: "flex", justifyContent: "flex-start", position: "relative", zIndex: 2, marginBottom: "0" }}>
                <span style={{
                  background: isEnrolled ? "hsl(142,70%,40%)" : "hsl(285,30%,50%)",
                  color: "#fff", fontSize: "10px", fontWeight: 900, padding: "6px 16px",
                  borderRadius: "20px", boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  display: "inline-block"
                }}>{isEnrolled ? "✓ Enrolled" : "◌ New Student"}</span>
              </div>

              {/* Info rows */}
              <div style={{ padding: "20px 24px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { icon: "📧", label: "Email", val: s.email || "—" },
                    { icon: "📞", label: "Phone", val: s.phone || "—" },
                    { icon: "🎓", label: "Batch", val: s.source || "Not Enrolled" },
                    { icon: "📅", label: "Joined", val: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "hsl(285,25%,98%)", borderRadius: "12px", border: "1px solid hsla(285,30%,20%,0.06)" }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{row.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "9px", fontWeight: 800, color: "hsl(285,20%,55%)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "2px" }}>{row.label}</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "hsl(285,50%,12%)", wordBreak: "break-all" }}>{row.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom strip */}
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button
                    onClick={() => { setCurrentView("leads"); setStudentTab("all"); closeCard(); }}
                    style={{
                      flex: 1, height: "40px", borderRadius: "12px", border: "none",
                      background: "linear-gradient(135deg,hsl(271,91%,60%),hsl(328,100%,54%))",
                      color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer",
                      boxShadow: "0 4px 16px -2px hsla(328,100%,54%,0.35)", transition: "all 0.2s"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "none")}
                  >View Full Profile</button>
                  <button
                    onClick={closeCard}
                    style={{
                      height: "40px", padding: "0 16px", borderRadius: "12px",
                      border: "1.5px solid hsla(285,30%,20%,0.14)", background: "#fff",
                      fontSize: "12px", fontWeight: 700, cursor: "pointer", color: "hsl(285,50%,12%)"
                    }}
                  >Close</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── GLOBAL HISTORY MODAL ───────────────────────────────────────── */}
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

export default App;
