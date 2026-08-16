import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { exportStaff, exportTeachers, exportLoginUsers } from "./utils/exportExcel";
import { Skeleton } from "./components/ui/Skeleton";
import { Toggle } from "./components/ui/Toggle";
import { api, setToken, getToken } from "./utils/api";
import { Login } from "./components/Login";
import { StudentManagement } from "./components/StudentManagement";
import { StudentProfile } from "./components/StudentProfile";
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
import { NewEnrollment } from "./components/NewEnrollment";
import { OnlineAdmissions } from "./components/OnlineAdmissions";
import { BulkPromotion } from "./components/BulkPromotion";
import { ExaminationSystem } from "./components/ExaminationSystem";
import { MarksheetSystem } from "./components/MarksheetSystem";
import { WeakStudentModule } from "./components/WeakStudentModule";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/ui/Sidebar";
import { CommandPalette } from "./components/ui/CommandPalette";
import { NotificationCenter } from "./components/ui/NotificationCenter";
import {
  Search, Plus, Check, GraduationCap, TrendingUp,
  Menu, X, LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  Filter, Settings, LogOut, ShieldCheck, Sparkles,
  Activity, BookOpen, IndianRupee, History, Sun, Moon, Download
} from "lucide-react";

type ViewType = "dashboard" | "leads" | "new-enrollment" | "online-admissions" | "bulk-promotion" | "examination" | "marksheet" | "weak-students" | "admissions" | "parents" | "schedule" | "billing" | "staff" | "teachers" | "attendance" | "exams" | "academics" | "homework" | "transport" | "library" | "communication" | "reports" | "roles" | "settings" | "onboarding";
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

  const filteredStaff = activeStaffFilter === "ALL" ? staffList.filter(s => s.role !== "TEACHER") : staffList.filter(s => s.role === activeStaffFilter);
  const userInitials = userProfile?.user_metadata?.name
    ? userProfile.user_metadata.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : userProfile?.email ? userProfile.email.substring(0, 2).toUpperCase() : "DA";
  const userName = userProfile?.user_metadata?.name || userProfile?.email?.split("@")[0] || "Dharmendra";
  const userRole = userProfile?.user_metadata?.role || "Super Administrator";

  const [showLogin, setShowLogin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editStaffMember, setEditStaffMember] = useState<any>(null);
  const [editStaffForm, setEditStaffForm] = useState({ name: "", phone: "", email: "", role: "", salary: "" });
  const [savingStaff, setSavingStaff] = useState(false);
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
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
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
          { view: "new-enrollment", icon: <Users2 size={20} />,     label: "Enroll" },
          { view: "schedule",  icon: <CalendarDays size={20} />,    label: "Timetable" },
          { view: "attendance",icon: <Check size={20} />,           label: "Attendance" },
          { view: "billing",   icon: <CreditCard size={20} />,      label: "Billing" },
          { view: "staff",     icon: <Briefcase size={20} />,       label: "Staff" },
        ] as { view: ViewType; icon: React.ReactNode; label: string }[]).map(({ view, icon, label }) => (
          <button key={view} className={`crm-dock-item ${currentView === view ? "is-active" : ""}`} onClick={() => { setCurrentView(view); }}>
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
            {/* Mobile hamburger */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                display: "none", alignItems: "center", justifyContent: "center",
                width: "36px", height: "36px", borderRadius: "10px", border: "none",
                background: "hsla(285,30%,20%,0.06)", cursor: "pointer",
              }}
            >
              <Menu size={20} style={{ color: "var(--text-primary)" }} />
            </button>
            <GraduationCap size={26} style={{ color: "var(--color-accent)" }} />
            <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0 }} className="text-gradient-indigo">E-CRM Portal</h2>
            <span className="navbar-logo-badge">PRO</span>
          </div>

          <div className="navbar-search-box" style={{ display: "flex", width: "300px", position: "relative" }}>
            <Search size={15} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search student, staff, teacher..."
              className="navbar-search-input"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") setGlobalSearch("");
                if (e.key === "Enter") {
                  const q = globalSearch.toLowerCase().trim();
                  const hits = leadsList.filter(s => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q));
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
              const studentHits = leadsList.filter(s => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q));
              const staffHits = staffList.filter(s => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)).map(s => ({ ...s, status: s.role, source: s.role, phone: s.phone || "" }));
              const hits = [...studentHits, ...staffHits];
              if (hits.length === 0) return (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                  background: "#fff", borderRadius: "14px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 99999,
                  border: "1px solid hsla(285,30%,20%,0.08)", overflow: "hidden"
                }}>
                  <div style={{ padding: "14px 16px", fontSize: "12px", color: "hsl(285,20%,55%)", textAlign: "center" }}>
                    No results found for <strong>"{globalSearch}"</strong>
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
                    {hits.length} result{hits.length !== 1 ? "s" : ""} found
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
                            {s.name}
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
                  <button className="dropdown-item" onClick={() => { setIsProfileOpen(false); setCurrentView("settings" as ViewType); }}><Settings size={14} /><span>Settings</span></button>
                  <button className="dropdown-item" onClick={() => { setIsProfileOpen(false); setCurrentView("roles" as ViewType); }}><ShieldCheck size={14} /><span>Security</span></button>
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

          {/* ══════════════ ONLINE ADMISSIONS VIEW ══════════════ */}
          {currentView === "online-admissions" && <OnlineAdmissions />}

          {/* ══════════════ BULK PROMOTION VIEW ══════════════ */}
          {currentView === "bulk-promotion" && <BulkPromotion />}

          {/* ══════════════ EXAMINATION SYSTEM VIEW ══════════════ */}
          {currentView === "examination" && <ExaminationSystem />}

          {/* ══════════════ MARKSHEET VIEW ══════════════ */}
          {currentView === "marksheet" && <MarksheetSystem />}

          {/* ══════════════ WEAK STUDENT VIEW ══════════════ */}
          {currentView === "weak-students" && <WeakStudentModule />}

          {/* ══════════════ NEW ENROLLMENT VIEW ══════════════ */}
          {currentView === "new-enrollment" && (
            <div className="animate-fade-in">
              <NewEnrollment />
            </div>
          )}

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
              <div style={{ marginBottom: "28px" }}>
                <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Staff Directory</h1>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>All registered staff members</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "10px" }}>
                <Button variant="ghost" size="sm" style={{ fontSize: "12px", gap: "4px" }} onClick={() => exportStaff(filteredStaff)}>
                  <Download size={14} /> Export Staff
                </Button>
                <Button variant="ghost" size="sm" style={{ fontSize: "12px", gap: "4px" }} onClick={async () => {
                  try {
                    const res = await api.staff.getAllUsers();
                    if (res.data) exportLoginUsers(res.data);
                  } catch (e) { console.error(e); }
                }}>
                  <Download size={14} /> Export All Login Users
                </Button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {filteredStaff.length === 0 ? (
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>No staff registered yet. Add one via New Enrollment.</p>
                ) : filteredStaff.map(staff => {
                  const rm = ROLE_META[staff.role] || { color: "var(--text-secondary)", bg: "rgba(0,0,0,0.05)" };
                  return (
                    <div key={staff.id} onClick={() => { setEditStaffMember(staff); setEditStaffForm({ name: staff.name, phone: staff.phone, email: staff.email, role: staff.role, salary: "" }); }}
                      style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: `1.5px solid ${rm.color}22`, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${rm.color}55`; e.currentTarget.style.boxShadow = `0 4px 16px ${rm.color}15`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${rm.color}22`; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                        <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: rm.bg, border: `2px solid ${rm.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: rm.color, flexShrink: 0 }}>
                          {staff.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{staff.name}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{staff.email}</p>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: rm.color, background: rm.bg, padding: "3px 8px", borderRadius: "20px", flexShrink: 0 }}>{staff.role}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {staff.phone && <span>📞 {staff.phone}</span>}
                      </div>
                      <p style={{ margin: "10px 0 0", fontSize: "10px", color: "hsl(271,91%,60%)", fontWeight: 600 }}>Click to edit details & salary</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════ SETTINGS VIEW ══════════════ */}
          {currentView === "settings" && <SettingsPage />}

          {/* ══════════════ TEACHERS VIEW ══════════════ */}
          {currentView === "teachers" && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: "28px" }}>
                <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Teachers</h1>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>All registered teachers and instructors</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <Button variant="ghost" size="sm" style={{ fontSize: "12px", gap: "4px" }} onClick={() => exportTeachers(staffList.filter(s => s.role === "TEACHER"))}>
                  <Download size={14} /> Export Excel
                </Button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {staffList.filter(s => s.role === "TEACHER").length === 0 ? (
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>No teachers registered yet. Add one via New Enrollment.</p>
                ) : staffList.filter(s => s.role === "TEACHER").map(teacher => (
                  <div key={teacher.id} onClick={() => { setEditStaffMember(teacher); setEditStaffForm({ name: teacher.name, phone: teacher.phone, email: teacher.email, role: teacher.role, salary: "" }); }}
                    style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1.5px solid hsla(142,70%,45%,0.15)", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsla(142,70%,45%,0.4)"; e.currentTarget.style.boxShadow = "0 4px 16px hsla(142,70%,45%,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsla(142,70%,45%,0.15)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                      <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "hsla(142,70%,45%,0.1)", border: "2px solid hsla(142,70%,45%,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--color-success)", flexShrink: 0 }}>
                        {teacher.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{teacher.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{teacher.email}</p>
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,45%,0.1)", padding: "3px 8px", borderRadius: "8px" }}>TEACHER</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {teacher.phone && <span>📞 {teacher.phone}</span>}
                      <span>📚 {teacher.title || "General"}</span>
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: "10px", color: "hsl(271,91%,60%)", fontWeight: 600 }}>Click to edit details & salary</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* ── SEARCH RESULT: Full Student Profile ────────────── */}
      {globalSearchCard && (
        <StudentProfile
          studentId={globalSearchCard.id}
          onClose={() => { setGlobalSearchCard(null); setIsCardClosing(false); }}
        />
      )}

      {/* ── EDIT STAFF/TEACHER MODAL ───────────────────────────────── */}
      {editStaffMember && (
        <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setEditStaffMember(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "440px" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Edit {editStaffMember.role === "TEACHER" ? "Teacher" : "Staff"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Name</label>
                <input value={editStaffForm.name} onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Phone</label>
                <input value={editStaffForm.phone} onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Email</label>
                <input value={editStaffForm.email} readOnly
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "#f9f9f9" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Monthly Salary (₹)</label>
                <input value={editStaffForm.salary} onChange={(e) => setEditStaffForm({ ...editStaffForm, salary: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="e.g. 25000"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Role</label>
                <select value={editStaffForm.role} onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "#fff" }}>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPPORT">Support Staff</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setEditStaffMember(null)}>Cancel</Button>
              <Button variant="primary" isLoading={savingStaff} onClick={async () => {
                setSavingStaff(true);
                try {
                  const nameParts = editStaffForm.name.split(" ");
                  await api.staff.update(editStaffMember.id, { firstName: nameParts[0], lastName: nameParts.slice(1).join(" ") || nameParts[0], phone: editStaffForm.phone, role: editStaffForm.role });
                  setEditStaffMember(null);
                  fetchStaff();
                } catch (err: any) { alert(err.message || "Update failed"); }
                setSavingStaff(false);
              }}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL HISTORY MODAL ───────────────────────────────────────── */}
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

export default App;
