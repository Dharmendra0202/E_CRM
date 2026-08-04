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
import { Dashboard } from "./components/Dashboard";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { UserRoleManagement } from "./components/UserRoleManagement";
import { AdmissionsCRM } from "./components/AdmissionsCRM";
import { ParentManagement } from "./components/ParentManagement";
import { AcademicManagement } from "./components/AcademicManagement";
import { HomeworkAssignments } from "./components/HomeworkAssignments";
import { FeeManagement } from "./components/FeeManagement";
import { TransportManagement } from "./components/TransportManagement";
import { LibraryManagement } from "./components/LibraryManagement";
import { CommunicationCenter } from "./components/CommunicationCenter";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { SettingsPage } from "./components/SettingsPage";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/ui/Sidebar";
import { CommandPalette } from "./components/ui/CommandPalette";
import { NotificationCenter } from "./components/ui/NotificationCenter";
import {
  Search, Plus, Check, GraduationCap, TrendingUp,
  Menu, X, LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  Filter, Settings, LogOut, ShieldCheck, Sparkles,
  Activity, BookOpen, IndianRupee, History, Sun, Moon
} from "lucide-react";

type ViewType = "dashboard" | "leads" | "admissions" | "parents" | "schedule" | "billing" | "staff" | "attendance" | "exams" | "academics" | "homework" | "transport" | "library" | "communication" | "reports" | "roles" | "settings" | "onboarding";
type StaffRoleType = "ALL" | "ADMIN" | "TEACHER" | "SALES" | "BILLING" | "SUPPORT";

function App() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const [batchesList, setBatchesList] = useState<any[]>([]);
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

  const fetchBatches = async () => {
    try {
      const res = await api.batches.getAll();
      if (res.data) setBatchesList(res.data);
      else setBatchesList([]);
    } catch { setBatchesList([]); }
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
      fetchBatches();
    }
  }, [userProfile, currentView]);

  const filteredStaff = activeStaffFilter === "ALL" ? staffList : staffList.filter(s => s.role === activeStaffFilter);
  const userInitials = userProfile?.user_metadata?.name
    ? userProfile.user_metadata.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : userProfile?.email ? userProfile.email.substring(0, 2).toUpperCase() : "DA";
  const userName = userProfile?.user_metadata?.name || userProfile?.email?.split("@")[0] || "Dharmendra";
  const userRole = userProfile?.user_metadata?.role || "Super Administrator";

  const [showLogin, setShowLogin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("ecrm_theme") === "dark");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("ecrm_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!userProfile) {
    if (showLogin) return <Login onLoginSuccess={(u) => setUserProfile(u)} />;
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

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
    <div className={`crm-container relative overflow-hidden has-sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="radial-spotlight" />

      {/* ── Sidebar ── */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => { setCurrentView(view as ViewType); if (view === "leads") setStudentTab("all"); }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* ── Command Palette ── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(view) => { setCurrentView(view as ViewType); if (view === "leads") setStudentTab("all"); }}
      />

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
            
            {/* Command Palette Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              title="Command Palette (Ctrl+K)"
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "transparent", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}
            >
              <Search size={13} />
              <span>Ctrl+K</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--border-glass)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", transition: "all 0.2s" }}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Button
              variant="ghost"
              title="Activity History"
              onClick={() => setIsHistoryOpen(true)}
              style={{ position: "relative", width: "36px", height: "36px", padding: 0, borderRadius: "50%" }}
            >
              <History size={17} />
            </Button>

            {/* Notification Center */}
            <NotificationCenter
              invoiceCount={invoicesList.filter((i: any) => i.status === "UNPAID").length}
              studentCount={leadsList.filter((s: any) => { const d = new Date(s.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length}
              homeworkCount={0}
            />

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
                  <button className="dropdown-item dropdown-item-danger" onClick={() => { setIsProfileOpen(false); setToken(null); setUserProfile(null); }}>
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
            <Dashboard
              isLoading={isLoading}
              leadsList={leadsList}
              invoicesList={invoicesList}
              attendanceList={attendanceList}
              batchesList={batchesList}
              staffList={staffList}
              userName={userName}
              onNavigate={(view, opts) => {
                setCurrentView(view as ViewType);
                if (view === "leads" && opts?.tab) setStudentTab(opts.tab);
              }}
            />
          )}

          {/* ══════════════ STUDENTS VIEW ══════════════ */}
          {/* ══════════════ ADMISSIONS CRM VIEW ══════════════ */}
          {currentView === "admissions" && <AdmissionsCRM />}

          {/* ══════════════ PARENTS VIEW ══════════════ */}
          {currentView === "parents" && <ParentManagement />}

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
          {currentView === "billing" && <FeeManagement />}

          {/* ══════════════ ACADEMICS VIEW ══════════════ */}
          {currentView === "academics" && <AcademicManagement />}

          {/* ══════════════ HOMEWORK VIEW ══════════════ */}
          {currentView === "homework" && <HomeworkAssignments />}

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

          {/* ══════════════ SETTINGS VIEW ══════════════ */}
          {currentView === "settings" && <SettingsPage />}

          {/* ══════════════ ROLES & PERMISSIONS VIEW ══════════════ */}
          {currentView === "roles" && <UserRoleManagement />}

          {/* ══════════════ TRANSPORT VIEW ══════════════ */}
          {currentView === "transport" && <TransportManagement />}

          {/* ══════════════ LIBRARY VIEW ══════════════ */}
          {currentView === "library" && <LibraryManagement />}

          {/* ══════════════ COMMUNICATION VIEW ══════════════ */}
          {currentView === "communication" && <CommunicationCenter />}

          {/* ══════════════ REPORTS VIEW ══════════════ */}
          {currentView === "reports" && <ReportsAnalytics />}

          {/* ══════════════ ONBOARDING VIEW ══════════════ */}
          {currentView === "onboarding" && (
            <OnboardingWizard onComplete={() => setCurrentView("dashboard")} />
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
