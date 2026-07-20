import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { Skeleton } from "./components/ui/Skeleton";
import { Toggle } from "./components/ui/Toggle";
import { supabase } from "./utils/supabaseClient";
import { Login } from "./components/Login";
import { StudentManagement } from "./components/StudentManagement";
import {
  Search, User, Plus, Check, GraduationCap, DollarSign, TrendingUp,
  Menu, X, LayoutDashboard, Users2, CalendarDays, CreditCard, Briefcase,
  ExternalLink, Filter, Settings, LogOut, ShieldCheck, Bell, Sparkles,
  Activity, BookOpen, AlertCircle, ArrowUpRight, Clock, UserCheck,
  BarChart3, IndianRupee, CheckCircle2, XCircle, Target, Zap
} from "lucide-react";

type ViewType = "dashboard" | "leads" | "schedule" | "billing" | "staff" | "attendance";
type StaffRoleType = "ALL" | "ADMIN" | "TEACHER" | "SALES" | "BILLING" | "SUPPORT";

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeStaffFilter, setActiveStaffFilter] = useState<StaffRoleType>("ALL");
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("Grade 10 Algebra");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [absenceAlertChecked, setAbsenceAlertChecked] = useState(true);
  const [attendanceNotificationText, setAttendanceNotificationText] = useState("");
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setLeadsList(data);
    } catch {
      setLeadsList([
        { id: "1", name: "Alice Cooper", email: "alice@rock.com", phone: "+91 98001 11001", status: "NEW", source: "Facebook Ad", created_at: "2026-07-18" },
        { id: "2", name: "John Connor", email: "jconnor@sky.net", phone: "+91 98001 22002", status: "CONTACTED", source: "Referral", created_at: "2026-07-17" },
        { id: "3", name: "Sarah Connor", email: "sconnor@sky.net", phone: "+91 98001 33003", status: "DEMO_SCHEDULED", source: "Web Form", created_at: "2026-07-16" },
        { id: "4", name: "Marcus Wright", email: "mwright@cyber.com", phone: "+91 98001 44004", status: "ENROLLED", source: "Google Search", created_at: "2026-07-15" },
        { id: "5", name: "Diana Prince", email: "dprince@hero.com", phone: "+91 98001 55005", status: "NEW", source: "Instagram", created_at: "2026-07-14" },
        { id: "6", name: "Bruce Wayne", email: "bwayne@gotham.com", phone: "+91 98001 66006", status: "LOST", source: "Cold Call", created_at: "2026-07-13" },
      ]);
    }
  };

  const loadMockStaff = () => {
    setStaffList([
      { id: "s1", name: "Dharmendra Admin", initials: "DA", role: "ADMIN", title: "Super Administrator", email: "dharmendra@ecrm.com", phone: "+1555101", status: "Online", assignment: "Database Audits, Access Controls" },
      { id: "s2", name: "Sarah Jenkins", initials: "SJ", role: "ADMIN", title: "Admissions Registrar", email: "sjenkins@ecrm.com", phone: "+1555102", status: "Online", assignment: "Student Rosters, Batch Placement" },
      { id: "s3", name: "Prof. Aaron Carter", initials: "AC", role: "TEACHER", title: "Mathematics Head — Ph.D.", email: "acarter@ecrm.com", phone: "+1555103", status: "In Class", assignment: "Grade 10 Algebra, Calculus Advanced" },
      { id: "s4", name: "Prof. Bruce Banner", initials: "BB", role: "TEACHER", title: "Physics Instructor — M.Sc.", email: "bbanner@ecrm.com", phone: "+1555104", status: "On Break", assignment: "Grade 8 Mechanics, Thermal Dynamics" },
      { id: "s5", name: "Clara Oswald", initials: "CO", role: "SALES", title: "Senior Admissions Advisor", email: "coswald@ecrm.com", phone: "+1555105", status: "Online", assignment: "Lead Pipeline Audits, Parent Consultation" },
      { id: "s6", name: "Tony Stark", initials: "TS", role: "BILLING", title: "Finance Controller", email: "tstark@ecrm.com", phone: "+1555106", status: "Offline", assignment: "Stripe Reconciliations, Billing Overdues" },
      { id: "s7", name: "Peter Parker", initials: "PP", role: "SUPPORT", title: "IT Support Technician", email: "pparker@ecrm.com", phone: "+1555107", status: "Online", assignment: "Vite Bundles, Database Backups" },
    ]);
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setStaffList(data.map((s: any) => ({ id: s.id, name: s.name, initials: s.initials, role: s.role, title: s.title, email: s.email, phone: s.phone, status: s.status, assignment: s.assignment })));
      } else loadMockStaff();
    } catch { loadMockStaff(); }
  };

  useEffect(() => {
    if (selectedBatch === "Grade 10 Algebra") {
      setAttendanceList([
        { id: "a1", name: "Alice Connor", initials: "AC", email: "aconnor@gmail.com", rate: "96%", status: "PRESENT", remarks: "" },
        { id: "a2", name: "Tommy Miller", initials: "TM", email: "tmiller@gmail.com", rate: "92%", status: "PRESENT", remarks: "" },
        { id: "a3", name: "John Smith", initials: "JS", email: "jsmith@gmail.com", rate: "84%", status: "PRESENT", remarks: "" },
        { id: "a4", name: "Emma Watson", initials: "EW", email: "ewatson@gmail.com", rate: "100%", status: "PRESENT", remarks: "" },
      ]);
    } else {
      setAttendanceList([
        { id: "p1", name: "Bruce Stark", initials: "BS", email: "bstark@gmail.com", rate: "88%", status: "PRESENT", remarks: "" },
        { id: "p2", name: "Peter Banner", initials: "PB", email: "pbanner@gmail.com", rate: "95%", status: "PRESENT", remarks: "" },
        { id: "p3", name: "Marcus Carter", initials: "MC", email: "mcarter@gmail.com", rate: "91%", status: "PRESENT", remarks: "" },
      ]);
    }
  }, [selectedBatch]);

  const handleToggleAttendance = (id: string, status: "PRESENT" | "ABSENT" | "LATE") =>
    setAttendanceList(attendanceList.map(s => s.id === id ? { ...s, status } : s));

  const handleRemarksChange = (id: string, remarks: string) =>
    setAttendanceList(attendanceList.map(s => s.id === id ? { ...s, remarks } : s));

  const handleSaveAttendance = async () => {
    setBtnLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const absent = attendanceList.filter(s => s.status === "ABSENT").length;
    setAttendanceNotificationText(`Attendance saved for ${attendanceList.length} students.${absent > 0 && absenceAlertChecked ? ` ${absent} absence alert(s) sent to parents.` : ""}`);
    setTimeout(() => setAttendanceNotificationText(""), 5000);
    setBtnLoading(false);
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: string) =>
    setLeadsList(leadsList.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) setUserProfile(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session?.user) setUserProfile(session.user);
      else setUserProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (userProfile) { fetchLeads(); fetchStaff(); } }, [userProfile]);

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

  // ── Derived stats ──────────────────────────────────────────
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
          { view: "leads",     icon: <Users2 size={20} />,          label: "Leads CRM" },
          { view: "schedule",  icon: <CalendarDays size={20} />,    label: "Timetable" },
          { view: "attendance",icon: <Check size={20} />,           label: "Attendance" },
          { view: "billing",   icon: <CreditCard size={20} />,      label: "Billing" },
          { view: "staff",     icon: <Briefcase size={20} />,       label: "Staff" },
        ] as { view: ViewType; icon: React.ReactNode; label: string }[]).map(({ view, icon, label }) => (
          <button key={view} className={`crm-dock-item ${currentView === view ? "is-active" : ""}`} onClick={() => setCurrentView(view)}>
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

          <div className="navbar-search-box" style={{ display: "flex", width: "280px" }}>
            <Search size={15} style={{ color: "var(--text-secondary)" }} />
            <input type="text" placeholder="Search anything..." className="navbar-search-input"
              value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                  <button className="dropdown-item dropdown-item-danger" onClick={async () => { setIsProfileOpen(false); await supabase.auth.signOut(); setUserProfile(null); setSession(null); }}>
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
                { view: "leads",     icon: <Users2 size={18} />,          label: "Leads CRM" },
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
                  <button onClick={() => setCurrentView("leads")} style={{ background: "hsla(0,0%,100%,0.18)", border: "1px solid hsla(0,0%,100%,0.3)", borderRadius: "12px", padding: "10px 16px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s", backdropFilter: "blur(8px)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "hsla(0,0%,100%,0.28)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "hsla(0,0%,100%,0.18)")}>
                    <Plus size={14} /> Add Lead
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
                {[
                  { icon: <Users2 size={22} />, grad: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", label: "Total Students", value: "458", badge: "+12 this month" },
                  { icon: <IndianRupee size={22} />, grad: "linear-gradient(135deg,hsl(142,70%,42%),hsl(160,70%,35%))", label: "Fees Collected", value: "₹1,28,500", badge: "92% of target" },
                  { icon: <UserCheck size={22} />, grad: "linear-gradient(135deg,hsl(271,91%,60%),hsl(240,80%,65%))", label: "Avg Attendance", value: "94.2%", badge: "+1.3% this week" },
                  { icon: <Target size={22} />, grad: "linear-gradient(135deg,hsl(38,92%,50%),hsl(20,95%,55%))", label: "Active Leads", value: String(totalLeads), badge: `${newLeads} new today` },
                ].map((m, i) => (
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
                      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Recent Lead Inquiries</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>Latest admissions pipeline activity</p>
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
                        { label: "Add New Lead",     icon: <Plus size={13} />,         view: "leads"      as ViewType, color: "hsl(328,100%,54%)" },
                        { label: "Mark Attendance",  icon: <CheckCircle2 size={13} />, view: "attendance" as ViewType, color: "hsl(142,70%,42%)" },
                        { label: "Issue Invoice",    icon: <IndianRupee size={13} />,  view: "billing"    as ViewType, color: "hsl(38,92%,50%)" },
                        { label: "Schedule Class",   icon: <CalendarDays size={13} />, view: "schedule"   as ViewType, color: "hsl(271,91%,60%)" },
                      ].map(a => (
                        <button key={a.label} onClick={() => setCurrentView(a.view)}
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

          {/* ══════════════ LEADS CRM VIEW ══════════════ */}
          {currentView === "leads" && (
            <div className="animate-fade-in">
              <StudentManagement />
            </div>
          )}

          {/* ══════════════ TIMETABLE VIEW ══════════════ */}
          {currentView === "schedule" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                  <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Timetable Scheduler</h1>
                  <p>Manage batches, subjects, timings, and instructor conflicts.</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={15} />}>Schedule Class</Button>
              </div>
              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Skeleton variant="rect" height={60} /><Skeleton variant="rect" height={100} /><Skeleton variant="rect" height={100} />
                </div>
              ) : (
                <Card style={{ padding: 0, overflow: "hidden", gap: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid var(--border-glass)" }}>
                    {["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => (
                      <div key={d} style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textAlign: d === "Time" ? "left" : "center", background: "rgba(29,10,39,0.03)" }}>{d}</div>
                    ))}
                  </div>
                  {[
                    { time: "08:00 AM", slots: [
                      { day: 0, label: "Grade 10 Algebra", teacher: "Prof. Aaron", color: "var(--color-accent)", bg: "hsla(328,100%,54%,0.07)" },
                      { day: 2, label: "Grade 10 Algebra", teacher: "Prof. Aaron", color: "var(--color-accent)", bg: "hsla(328,100%,54%,0.07)" },
                    ]},
                    { time: "10:00 AM", slots: [
                      { day: 1, label: "Grade 8 Physics", teacher: "Prof. Bruce", color: "var(--color-success)", bg: "hsla(142,70%,40%,0.07)" },
                      { day: 3, label: "Grade 8 Physics", teacher: "Prof. Bruce", color: "var(--color-success)", bg: "hsla(142,70%,40%,0.07)" },
                    ]},
                    { time: "02:00 PM", slots: [
                      { day: 0, label: "Calculus Adv.", teacher: "Prof. Aaron", color: "hsl(271,91%,60%)", bg: "hsla(271,91%,60%,0.07)" },
                      { day: 2, label: "Thermal Dynamics", teacher: "Prof. Bruce", color: "hsl(38,92%,50%)", bg: "hsla(38,92%,50%,0.07)" },
                      { day: 4, label: "Calculus Adv.", teacher: "Prof. Aaron", color: "hsl(271,91%,60%)", bg: "hsla(271,91%,60%,0.07)" },
                    ]},
                    { time: "04:00 PM", slots: [
                      { day: 1, label: "Demo Class", teacher: "Clara Oswald", color: "hsl(200,95%,50%)", bg: "hsla(200,95%,50%,0.07)" },
                      { day: 3, label: "Grade 10 Algebra", teacher: "Prof. Aaron", color: "var(--color-accent)", bg: "hsla(328,100%,54%,0.07)" },
                    ]},
                  ].map(row => (
                    <div key={row.time} style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid var(--border-glass)", minHeight: "90px" }}>
                      <div style={{ padding: "14px 12px", fontSize: "11px", color: "var(--text-secondary)", background: "rgba(29,10,39,0.02)", display: "flex", alignItems: "center", fontWeight: 600 }}>{row.time}</div>
                      {[0,1,2,3,4].map(dayIdx => {
                        const slot = row.slots.find(s => s.day === dayIdx);
                        return (
                          <div key={dayIdx} style={{ padding: "6px" }}>
                            {slot && (
                              <div style={{ background: slot.bg, borderLeft: `3px solid ${slot.color}`, borderRadius: "6px", padding: "8px 10px", height: "100%" }}>
                                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{slot.label}</p>
                                <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--text-secondary)" }}>{slot.teacher}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* ══════════════ ATTENDANCE VIEW ══════════════ */}
          {currentView === "attendance" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                  <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Attendance Tracker</h1>
                  <p>Select batch and date to log student attendance.</p>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-success)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Activity size={14} />Week Rate: 93.8%
                </span>
              </div>

              {attendanceNotificationText && (
                <div style={{ background: "hsla(142,70%,40%,0.08)", border: "1px solid hsla(142,70%,40%,0.2)", padding: "12px 16px", borderRadius: "10px", color: "var(--color-success)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <CheckCircle2 size={16} />{attendanceNotificationText}
                </div>
              )}

              <Card style={{ padding: "20px", marginBottom: "20px", gap: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px" }}>Class Batch</label>
                    <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "var(--surface-glass)", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, outline: "none" }}>
                      <option value="Grade 10 Algebra">Grade 10 Algebra A (Mathematics)</option>
                      <option value="Grade 8 Physics">Grade 8 Physics B (Physics)</option>
                    </select>
                  </div>
                  <div style={{ width: "190px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px" }}>Session Date</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "var(--surface-glass)", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, outline: "none" }} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", paddingBottom: "2px" }}>
                    <input type="checkbox" checked={absenceAlertChecked} onChange={e => setAbsenceAlertChecked(e.target.checked)}
                      style={{ width: "15px", height: "15px", accentColor: "var(--color-accent)", cursor: "pointer" }} />
                    Auto-Notify Parents
                  </label>
                </div>
              </Card>

              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[1,2,3].map(i => <Skeleton key={i} variant="rect" height={60} />)}
                </div>
              ) : (
                <Card style={{ padding: 0, overflow: "hidden", gap: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 1fr", padding: "12px 24px", background: "rgba(29,10,39,0.03)", borderBottom: "1px solid var(--border-glass)", fontWeight: 700, fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <div>Student</div><div style={{ textAlign: "center" }}>Status</div><div>Remarks</div>
                  </div>
                  {attendanceList.map(student => (
                    <div key={student.id} style={{ display: "grid", gridTemplateColumns: "1fr 180px 1fr", padding: "14px 24px", borderBottom: "1px solid var(--border-glass)", alignItems: "center", gap: "16px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "hsla(271,91%,60%,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "hsl(271,91%,60%)", flexShrink: 0 }}>{student.initials}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 650 }}>{student.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{student.email} • avg: <strong style={{ color: "var(--color-success)" }}>{student.rate}</strong></p>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                        {(["PRESENT","ABSENT","LATE"] as const).map(s => (
                          <button key={s} onClick={() => handleToggleAttendance(student.id, s)}
                            style={{ width: "36px", height: "36px", borderRadius: "8px", border: `2px solid ${student.status === s ? (s === "PRESENT" ? "var(--color-success)" : s === "ABSENT" ? "var(--color-danger)" : "hsl(38,92%,50%)") : "var(--border-glass)"}`, background: student.status === s ? (s === "PRESENT" ? "hsla(142,70%,40%,0.15)" : s === "ABSENT" ? "hsla(342,90%,48%,0.15)" : "hsla(38,92%,50%,0.15)") : "transparent", color: student.status === s ? (s === "PRESENT" ? "var(--color-success)" : s === "ABSENT" ? "var(--color-danger)" : "hsl(38,92%,50%)") : "var(--text-secondary)", fontWeight: 700, fontSize: "12px", cursor: "pointer", transition: "all 0.15s ease" }}>
                            {s[0]}
                          </button>
                        ))}
                      </div>
                      <input type="text" placeholder="Add a note..." value={student.remarks} onChange={e => handleRemarksChange(student.id, e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "transparent", fontSize: "12px", outline: "none", color: "var(--text-primary)" }} />
                    </div>
                  ))}
                  <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(29,10,39,0.02)" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      <strong>{selectedBatch}</strong> • <strong>{selectedDate}</strong> • {attendanceList.length} students
                    </span>
                    <Button variant="primary" isLoading={btnLoading} onClick={handleSaveAttendance} leftIcon={<Check size={15} />}>
                      Save & Notify
                    </Button>
                  </div>
                </Card>
              )}
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
                {[
                  { label: "Total Billed", value: "₹1,42,000", color: "var(--color-accent)", bg: "hsla(328,100%,54%,0.08)" },
                  { label: "Collected", value: "₹1,28,500", color: "var(--color-success)", bg: "hsla(142,70%,40%,0.08)" },
                  { label: "Outstanding", value: "₹13,500", color: "var(--color-danger)", bg: "hsla(342,90%,48%,0.08)" },
                ].map(s => (
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
                  {[
                    { id: "INV-001", name: "John Connor", period: "July 2026 — Grade 10 Algebra", amount: "₹4,500", status: "UNPAID" },
                    { id: "INV-002", name: "Marcus Wright", period: "July 2026 — Grade 8 Physics", amount: "₹3,800", status: "PAID" },
                    { id: "INV-003", name: "Alice Cooper", period: "July 2026 — Grade 10 Algebra", amount: "₹4,500", status: "PARTIAL" },
                    { id: "INV-004", name: "Emma Watson", period: "June 2026 — Calculus Advanced", amount: "₹5,200", status: "PAID" },
                    { id: "INV-005", name: "Diana Prince", period: "July 2026 — Grade 8 Physics", amount: "₹3,800", status: "UNPAID" },
                  ].map(inv => {
                    const statusMap: Record<string, { color: string; bg: string; label: string }> = {
                      PAID:    { color: "var(--color-success)", bg: "hsla(142,70%,40%,0.1)", label: "Paid" },
                      UNPAID:  { color: "var(--color-danger)",  bg: "hsla(342,90%,48%,0.1)", label: "Unpaid" },
                      PARTIAL: { color: "hsl(38,92%,50%)",      bg: "hsla(38,92%,50%,0.1)",  label: "Partial" },
                    };
                    const s = statusMap[inv.status];
                    return (
                      <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", padding: "16px 24px", borderBottom: "1px solid var(--border-glass)", alignItems: "center", gap: "16px" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 650 }}>{inv.name}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>#{inv.id} • {inv.period}</p>
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: 700 }}>{inv.amount}</span>
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
    </div>
  );
}

export default App;
