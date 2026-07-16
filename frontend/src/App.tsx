import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/Card";
import { Skeleton } from "./components/ui/Skeleton";
import { Toggle } from "./components/ui/Toggle";
import {
  Search,
  User,
  Mail,
  Plus,
  Check,
  Trash2,
  AlertTriangle,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Menu,
  X,
  LayoutDashboard,
  Users2,
  CalendarDays,
  CreditCard,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Filter,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  Sparkles,
  Phone,
  MessageSquare,
  Activity
} from "lucide-react";

type ViewType = "dashboard" | "leads" | "schedule" | "billing" | "staff";
type StaffRoleType = "ALL" | "ADMIN" | "TEACHER" | "SALES" | "BILLING" | "SUPPORT";

function App() {
  // Navigation & UI States
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [demoToggle, setDemoToggle] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  // Staff Directory Filters
  const [activeStaffFilter, setActiveStaffFilter] = useState<StaffRoleType>("ALL");

  // Leads CRM Mock State
  const [leadsList, setLeadsList] = useState([
    { id: "1", name: "Alice Cooper", email: "alice@rock.com", phone: "+1555001", status: "NEW", source: "Facebook Ad" },
    { id: "2", name: "John Connor", email: "jconnor@sky.net", phone: "+1555002", status: "CONTACTED", source: "Referral" },
    { id: "3", name: "Sarah Connor", email: "sconnor@sky.net", phone: "+1555003", status: "DEMO", source: "Web Form" },
    { id: "4", name: "Marcus Wright", email: "mwright@cyber.com", phone: "+1555004", status: "ENROLLED", source: "Google Search" }
  ]);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");

  // CRM Staff Profiles Mock Data
  const [staffList] = useState([
    {
      id: "s1",
      name: "Dharmendra Admin",
      initials: "DA",
      role: "ADMIN",
      title: "Super Administrator",
      email: "dharmendra@ecrm.com",
      phone: "+1555101",
      status: "Online",
      assignment: "Database Audits, Access Controls",
      avatarClass: "avatar-admin",
      badgeClass: "role-badge-admin"
    },
    {
      id: "s2",
      name: "Sarah Jenkins",
      initials: "SJ",
      role: "ADMIN",
      title: "Admissions Registrar",
      email: "sjenkins@ecrm.com",
      phone: "+1555102",
      status: "Online",
      assignment: "Student Rosters, Batch Placement",
      avatarClass: "avatar-admin",
      badgeClass: "role-badge-admin"
    },
    {
      id: "s3",
      name: "Prof. Aaron Carter",
      initials: "AC",
      role: "TEACHER",
      title: "Mathematics Head — Ph.D.",
      email: "acarter@ecrm.com",
      phone: "+1555103",
      status: "In Class",
      assignment: "Grade 10 Algebra, Calculus Advanced",
      avatarClass: "avatar-teacher",
      badgeClass: "role-badge-teacher"
    },
    {
      id: "s4",
      name: "Prof. Bruce Banner",
      initials: "BB",
      role: "TEACHER",
      title: "Physics Instructor — M.Sc.",
      email: "bbanner@ecrm.com",
      phone: "+1555104",
      status: "On Break",
      assignment: "Grade 8 Mechanics, Thermal Dynamics",
      avatarClass: "avatar-teacher",
      badgeClass: "role-badge-teacher"
    },
    {
      id: "s5",
      name: "Clara Oswald",
      initials: "CO",
      role: "SALES",
      title: "Senior Admissions Advisor",
      email: "coswald@ecrm.com",
      phone: "+1555105",
      status: "Online",
      assignment: "Lead Pipeline Audits, Parent Consultation",
      avatarClass: "avatar-sales",
      badgeClass: "role-badge-sales"
    },
    {
      id: "s6",
      name: "Tony Stark",
      initials: "TS",
      role: "BILLING",
      title: "Finance Controller",
      email: "tstark@ecrm.com",
      phone: "+1555106",
      status: "Offline",
      assignment: "Stripe Reconciliations, Billing Overdues",
      avatarClass: "avatar-billing",
      badgeClass: "role-badge-billing"
    },
    {
      id: "s7",
      name: "Peter Parker",
      initials: "PP",
      role: "SUPPORT",
      title: "IT Support Technician",
      email: "pparker@ecrm.com",
      phone: "+1555107",
      status: "Online",
      assignment: "Vite Bundles, Database Backups",
      avatarClass: "avatar-support",
      badgeClass: "role-badge-support"
    }
  ]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) return;
    const newLead = {
      id: Date.now().toString(),
      name: newLeadName,
      email: newLeadEmail || "no-email@inquiry.com",
      phone: "+1555099",
      status: "NEW",
      source: "Manual Entry"
    };
    setLeadsList([...leadsList, newLead]);
    setNewLeadName("");
    setNewLeadEmail("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val.length > 0 && val.length < 3) {
      setInputError("Name must be at least 3 characters.");
    } else {
      setInputError("");
    }
  };

  const triggerBtnLoader = () => {
    setBtnLoading(true);
    setTimeout(() => setBtnLoading(false), 2000);
  };

  // Simulate dashboard initial load
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [currentView]);

  // Filtered Staff Logic
  const filteredStaff = activeStaffFilter === "ALL" 
    ? staffList 
    : staffList.filter(s => s.role === activeStaffFilter);

  return (
    <div className="bg-grid-pattern min-h-screen pb-16 relative overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Spotlight effect overlay */}
      <div className="radial-spotlight" />

      {/* Global Responsive Navbar */}
      <header className="navbar-gradient-top-border" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "hsla(0, 0%, 100%, 0.75)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-glass)",
        padding: "15.5px var(--space-xl)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px"
        }}>
          {/* 1. Brand/Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <GraduationCap size={28} className="text-gradient-indigo" style={{ color: "var(--color-accent)" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 700 }} className="text-gradient-indigo">E-CRM Portal</h2>
            <span className="navbar-logo-badge">PRO</span>
          </div>

          {/* 2. Desktop Navigation Pills (Hidden on mobile) */}
          <nav className="navbar-desktop-nav">
            <button
              className={`nav-pill-link ${currentView === "dashboard" ? "is-active" : ""}`}
              onClick={() => setCurrentView("dashboard")}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-pill-link ${currentView === "leads" ? "is-active" : ""}`}
              onClick={() => setCurrentView("leads")}
            >
              <Users2 size={16} />
              <span>Leads</span>
            </button>
            <button
              className={`nav-pill-link ${currentView === "schedule" ? "is-active" : ""}`}
              onClick={() => setCurrentView("schedule")}
            >
              <CalendarDays size={16} />
              <span>Timetable</span>
            </button>
            <button
              className={`nav-pill-link ${currentView === "billing" ? "is-active" : ""}`}
              onClick={() => setCurrentView("billing")}
            >
              <CreditCard size={16} />
              <span>Billing</span>
            </button>
            <button
              className={`nav-pill-link ${currentView === "staff" ? "is-active" : ""}`}
              onClick={() => setCurrentView("staff")}
            >
              <Briefcase size={16} />
              <span>Staff</span>
            </button>
          </nav>

          {/* 3. Centered Search Box (Hidden on mobile) */}
          <div className="navbar-search-box">
            <Search size={16} style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              placeholder="Search directory..."
              className="navbar-search-input"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* 4. Action Controls & Profile Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            {/* Notification Bell */}
            <Button variant="ghost" style={{ position: "relative", width: "38px", height: "38px", padding: 0, borderRadius: "50%" }}>
              <Bell size={18} />
              <span className="navbar-bell-ping" />
              <span className="navbar-bell-ping-ring" />
            </Button>

            {/* Profile Dropdown Trigger */}
            <div className="profile-dropdown-container">
              <button
                className="navbar-profile-trigger"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="User profile menu"
              >
                <div className="navbar-avatar-circle">DA</div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="navbar-profile-dropdown">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">Dharmendra Admin</div>
                    <div className="dropdown-user-role">Super Administrator</div>
                  </div>
                  
                  <button className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                    <Settings size={14} />
                    <span>Portal Settings</span>
                  </button>
                  <button className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                    <ShieldCheck size={14} />
                    <span>Security Logs</span>
                  </button>
                  
                  <hr style={{ border: 0, borderTop: "1px solid var(--border-glass)", margin: "4px 0" }} />

                  {/* Move loader simulator toggle in here to clean up bar */}
                  <div style={{ padding: "6px 12px" }}>
                    <Toggle
                      label="Simulate Loading"
                      checked={isLoading}
                      onChange={(e) => { setIsLoading(e.target.checked); setIsProfileOpen(false); }}
                      style={{ marginBottom: 0 }}
                    />
                  </div>

                  <hr style={{ border: 0, borderTop: "1px solid var(--border-glass)", margin: "4px 0" }} />

                  <button className="dropdown-item dropdown-item-danger" onClick={() => setIsProfileOpen(false)}>
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Drawer Toggle (Hidden on desktop) */}
            <div className="navbar-mobile-toggle">
              <Button
                variant={isMenuOpen ? "primary" : "secondary"}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ width: "38px", height: "38px", padding: 0 }}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* ==========================================
            MOBILE NAVIGATION DRAWER (Top-Slide down)
            ========================================== */}
        <nav className={`top-drawer ${isMenuOpen ? "is-open" : ""}`}>
          <div className="drawer-content-grid">
            <button
              className={`drawer-nav-item ${currentView === "dashboard" ? "is-active" : ""}`}
              onClick={() => { setCurrentView("dashboard"); setIsMenuOpen(false); }}
            >
              <div className="drawer-icon-box"><LayoutDashboard size={20} /></div>
              <span>Dashboard</span>
            </button>
            <button
              className={`drawer-nav-item ${currentView === "leads" ? "is-active" : ""}`}
              onClick={() => { setCurrentView("leads"); setIsMenuOpen(false); }}
            >
              <div className="drawer-icon-box"><Users2 size={20} /></div>
              <span>Leads CRM</span>
            </button>
            <button
              className={`drawer-nav-item ${currentView === "schedule" ? "is-active" : ""}`}
              onClick={() => { setCurrentView("schedule"); setIsMenuOpen(false); }}
            >
              <div className="drawer-icon-box"><CalendarDays size={20} /></div>
              <span>Timetable</span>
            </button>
            <button
              className={`drawer-nav-item ${currentView === "billing" ? "is-active" : ""}`}
              onClick={() => { setCurrentView("billing"); setIsMenuOpen(false); }}
            >
              <div className="drawer-icon-box"><CreditCard size={20} /></div>
              <span>Billing Invoice</span>
            </button>
            <button
              className={`drawer-nav-item ${currentView === "staff" ? "is-active" : ""}`}
              onClick={() => { setCurrentView("staff"); setIsMenuOpen(false); }}
            >
              <div className="drawer-icon-box"><Briefcase size={20} /></div>
              <span>Instructors</span>
            </button>
          </div>
          <div className="drawer-footer-banner">
            <span>Client Platform: Mobile Dashboard Portal v1.0.0</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              Academy Status: <span style={{ color: "var(--color-success)", fontWeight: 700 }}>● Online</span>
            </span>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1200px", margin: "32px auto 0 auto", padding: "0 var(--space-xl)", position: "relative", zIndex: 10 }}>

        {/* ==========================================
            VIEW: COMPONENTS KIT (DASHBOARD MOCKUP)
            ========================================== */}
        {currentView === "dashboard" && (
          <div className="animate-fade-in">
            {/* Banner/Hero */}
            <section style={{ marginBottom: "40px" }}>
              <h1 className="text-gradient-indigo" style={{ fontSize: "40px", marginBottom: "8px" }}>
                Premium UI Component Library
              </h1>
              <p style={{ fontSize: "16px", maxWidth: "600px" }}>
                Bespoke design widgets styled directly inside a single <code>main.css</code> file. Use the top Menu drawer to explore operational page mockups.
              </p>
            </section>

            {/* Metrics Analytics */}
            <section style={{ marginBottom: "48px" }}>
              <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>01.</span> Metric Analytics (Skeleton Loader Demo)
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                <Card glow={!isLoading} hoverLift={!isLoading}>
                  {isLoading ? (
                    <div>
                      <Skeleton variant="circle" width={40} height={40} style={{ marginBottom: "16px" }} />
                      <Skeleton variant="text" width="60%" style={{ marginBottom: "12px" }} />
                      <Skeleton variant="text" width="40%" height={24} />
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{ background: "hsla(328, 100%, 54%, 0.1)", padding: "10px", borderRadius: "10px" }}>
                          <User size={20} style={{ color: "var(--color-accent)" }} />
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-success)", fontWeight: 600 }}>+12% MoM</span>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 550, color: "var(--text-secondary)" }}>Active Student Profiles</p>
                      <h2 style={{ fontSize: "36px", marginTop: "4px" }}>{leadsList.length + 450}</h2>
                    </>
                  )}
                </Card>

                <Card hoverLift={!isLoading}>
                  {isLoading ? (
                    <div>
                      <Skeleton variant="circle" width={40} height={40} style={{ marginBottom: "16px" }} />
                      <Skeleton variant="text" width="60%" style={{ marginBottom: "12px" }} />
                      <Skeleton variant="text" width="40%" height={24} />
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{ background: "hsla(142, 70%, 45%, 0.1)", padding: "10px", borderRadius: "10px" }}>
                          <DollarSign size={20} style={{ color: "var(--color-success)" }} />
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-success)", fontWeight: 600 }}>92% collected</span>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 550, color: "var(--text-secondary)" }}>Monthly Invoiced Dues</p>
                      <h2 style={{ fontSize: "36px", marginTop: "4px" }} className="text-gradient-emerald">$12,850</h2>
                    </>
                  )}
                </Card>

                <Card hoverLift={!isLoading}>
                  {isLoading ? (
                    <div>
                      <Skeleton variant="circle" width={40} height={40} style={{ marginBottom: "16px" }} />
                      <Skeleton variant="text" width="60%" style={{ marginBottom: "12px" }} />
                      <Skeleton variant="text" width="40%" height={24} />
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{ background: "hsla(271, 91%, 60%, 0.1)", padding: "10px", borderRadius: "10px" }}>
                          <TrendingUp size={20} style={{ color: "var(--color-warning)" }} />
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-warning)", fontWeight: 600 }}>{leadsList.length} Active Leads</span>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 550, color: "var(--text-secondary)" }}>Lead Pipeline Conversion</p>
                      <h2 style={{ fontSize: "36px", marginTop: "4px" }}>18.4%</h2>
                    </>
                  )}
                </Card>
              </div>
            </section>

            {/* Core UI Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "32px" }}>
              <Card>
                <CardHeader>
                  <CardTitle>02. Input Control Elements</CardTitle>
                  <CardDescription>Buttons, states, toggles, loading alerts.</CardDescription>
                </CardHeader>
                <CardContent style={{ gap: "24px" }}>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", marginBottom: "10px", letterSpacing: "1px" }}>Button System</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="success" leftIcon={<Check size={16} />}>Success</Button>
                      <Button variant="danger" leftIcon={<Trash2 size={16} />}>Danger</Button>
                      <Button variant="warning" leftIcon={<AlertTriangle size={16} />}>Warning</Button>
                      <Button variant="ghost">Ghost</Button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <Button variant="primary" isLoading={btnLoading} onClick={triggerBtnLoader}>
                      Click to Load
                    </Button>
                    <Button variant="secondary" disabled>Disabled State</Button>
                  </div>

                  <hr style={{ border: 0, borderTop: "1px solid var(--border-glass)", margin: "8px 0" }} />

                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px", letterSpacing: "1px" }}>Toggle switches</p>
                    <Toggle
                      label="Receive Email Notifications"
                      description="Sent automatically when attendance or invoice alerts change."
                      checked={demoToggle}
                      onChange={(e) => setDemoToggle(e.target.checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>03. Glassmorphic Text Fields</CardTitle>
                  <CardDescription>Inputs featuring springy labels, accessories, and validation checks.</CardDescription>
                </CardHeader>
                <CardContent style={{ gap: "16px" }}>
                  <Input
                    label="Full Student Name"
                    placeholder=" "
                    value={inputValue}
                    onChange={handleInputChange}
                    error={inputError}
                    leftIcon={<User size={18} />}
                  />
                  <Input
                    label="Parent Contact Email"
                    type="email"
                    placeholder=" "
                    defaultValue="parent@family.com"
                    leftIcon={<Mail size={18} />}
                  />
                  <Input
                    placeholder="Search classes, schedules, and active batches..."
                    leftIcon={<Search size={18} />}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW: LEAD PIPELINE (CRM)
            ========================================== */}
        {currentView === "leads" && (
          <div className="animate-fade-in">
            <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div>
                <h1 className="text-gradient-indigo">Lead Inquiry Pipeline</h1>
                <p>Track student registrations, follow-ups, and demo bookings.</p>
              </div>
              <form onSubmit={handleAddLead} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <Input
                  placeholder="Lead Name"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  containerClassName="mb-0"
                  style={{ height: "42px", padding: "12px" }}
                />
                <Input
                  placeholder="Email"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  containerClassName="mb-0"
                  style={{ height: "42px", padding: "12px" }}
                />
                <Button type="submit" variant="primary" style={{ height: "42px" }} leftIcon={<Plus size={16} />}>
                  Add
                </Button>
              </form>
            </section>

            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                <Skeleton variant="rect" height={250} />
                <Skeleton variant="rect" height={250} />
                <Skeleton variant="rect" height={250} />
                <Skeleton variant="rect" height={250} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                
                {/* Column: NEW */}
                <Card style={{ background: "rgba(29, 10, 39, 0.02)" }}>
                  <CardHeader style={{ padding: "0 0 10px 0", borderBottom: "2px solid var(--color-accent)" }}>
                    <CardTitle style={{ fontSize: "15px", display: "flex", justifyContent: "space-between" }}>
                      <span>New Inquiry</span>
                      <span style={{ fontSize: "11px", background: "var(--border-glass)", padding: "2px 8px", borderRadius: "10px" }}>
                        {leadsList.filter(l => l.status === "NEW").length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ gap: "12px", marginTop: "16px", padding: 0 }}>
                    {leadsList.filter(l => l.status === "NEW").map(lead => (
                      <Card key={lead.id} hoverLift style={{ padding: "12px", background: "var(--surface-glass)" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 600 }}>{lead.name}</h4>
                        <p style={{ fontSize: "11px", margin: "4px 0" }}>{lead.email}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                          <span style={{ fontSize: "10px", background: "hsla(328, 100%, 54%, 0.1)", color: "var(--color-accent)", padding: "2px 6px", borderRadius: "4px" }}>
                            {lead.source}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setLeadsList(leadsList.map(l => l.id === lead.id ? {...l, status: "CONTACTED"} : l));
                          }} style={{ padding: "2px 4px", fontSize: "11px" }}>
                            Contact <ChevronRight size={12} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Column: CONTACTED */}
                <Card style={{ background: "rgba(29, 10, 39, 0.02)" }}>
                  <CardHeader style={{ padding: "0 0 10px 0", borderBottom: "2px solid var(--color-warning)" }}>
                    <CardTitle style={{ fontSize: "15px", display: "flex", justifyContent: "space-between" }}>
                      <span>Contacted</span>
                      <span style={{ fontSize: "11px", background: "var(--border-glass)", padding: "2px 8px", borderRadius: "10px" }}>
                        {leadsList.filter(l => l.status === "CONTACTED").length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ gap: "12px", marginTop: "16px", padding: 0 }}>
                    {leadsList.filter(l => l.status === "CONTACTED").map(lead => (
                      <Card key={lead.id} hoverLift style={{ padding: "12px", background: "var(--surface-glass)" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 600 }}>{lead.name}</h4>
                        <p style={{ fontSize: "11px", margin: "4px 0" }}>{lead.email}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                          <span style={{ fontSize: "10px", background: "hsla(271, 91%, 60%, 0.1)", color: "var(--color-warning)", padding: "2px 6px", borderRadius: "4px" }}>
                            {lead.source}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setLeadsList(leadsList.map(l => l.id === lead.id ? {...l, status: "DEMO"} : l));
                          }} style={{ padding: "2px 4px", fontSize: "11px" }}>
                            Demo <ChevronRight size={12} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Column: DEMO SCHEDULED */}
                <Card style={{ background: "rgba(29, 10, 39, 0.02)" }}>
                  <CardHeader style={{ padding: "0 0 10px 0", borderBottom: "2px solid var(--color-info)" }}>
                    <CardTitle style={{ fontSize: "15px", display: "flex", justifyContent: "space-between" }}>
                      <span>Demo Scheduled</span>
                      <span style={{ fontSize: "11px", background: "var(--border-glass)", padding: "2px 8px", borderRadius: "10px" }}>
                        {leadsList.filter(l => l.status === "DEMO").length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ gap: "12px", marginTop: "16px", padding: 0 }}>
                    {leadsList.filter(l => l.status === "DEMO").map(lead => (
                      <Card key={lead.id} hoverLift style={{ padding: "12px", background: "var(--surface-glass)" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 600 }}>{lead.name}</h4>
                        <p style={{ fontSize: "11px", margin: "4px 0" }}>{lead.email}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                          <span style={{ fontSize: "10px", background: "hsla(200, 95%, 50%, 0.1)", color: "var(--color-info)", padding: "2px 6px", borderRadius: "4px" }}>
                            {lead.source}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setLeadsList(leadsList.map(l => l.id === lead.id ? {...l, status: "ENROLLED"} : l));
                          }} style={{ padding: "2px 4px", fontSize: "11px" }}>
                            Enroll <ChevronRight size={12} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Column: ENROLLED */}
                <Card style={{ background: "rgba(29, 10, 39, 0.02)" }}>
                  <CardHeader style={{ padding: "0 0 10px 0", borderBottom: "2px solid var(--color-success)" }}>
                    <CardTitle style={{ fontSize: "15px", display: "flex", justifyContent: "space-between" }}>
                      <span>Enrolled</span>
                      <span style={{ fontSize: "11px", background: "var(--border-glass)", padding: "2px 8px", borderRadius: "10px" }}>
                        {leadsList.filter(l => l.status === "ENROLLED").length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ gap: "12px", marginTop: "16px", padding: 0 }}>
                    {leadsList.filter(l => l.status === "ENROLLED").map(lead => (
                      <Card key={lead.id} hoverLift style={{ padding: "12px", background: "var(--surface-glass)" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 600 }}>{lead.name}</h4>
                        <p style={{ fontSize: "11px", margin: "4px 0" }}>{lead.email}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                          <span style={{ fontSize: "10px", background: "hsla(142, 70%, 40%, 0.1)", color: "var(--color-success)", padding: "2px 6px", borderRadius: "4px" }}>
                            {lead.source}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--color-success)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <Check size={12} /> Student
                          </span>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        )}

        {/* ==========================================
            VIEW: TIMETABLE
            ========================================== */}
        {currentView === "schedule" && (
          <div className="animate-fade-in">
            <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div>
                <h1 className="text-gradient-indigo">Timetable Scheduler</h1>
                <p>Manage batches, subjects, timings, and instructor conflicts.</p>
              </div>
              <Button variant="primary" leftIcon={<Plus size={16} />}>Schedule Class</Button>
            </section>

            {isLoading ? (
              <Skeleton variant="rect" height={400} />
            ) : (
              <Card style={{ padding: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid var(--border-glass)" }}>
                  <div style={{ padding: "16px", fontWeight: 700, background: "rgba(29, 10, 39, 0.02)" }}>Time</div>
                  <div style={{ padding: "16px", fontWeight: 700, textAlign: "center" }}>Monday</div>
                  <div style={{ padding: "16px", fontWeight: 700, textAlign: "center" }}>Tuesday</div>
                  <div style={{ padding: "16px", fontWeight: 700, textAlign: "center" }}>Wednesday</div>
                  <div style={{ padding: "16px", fontWeight: 700, textAlign: "center" }}>Thursday</div>
                  <div style={{ padding: "16px", fontWeight: 700, textAlign: "center" }}>Friday</div>
                </div>

                {/* Day Timetable Layout */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  
                  {/* Row 1: 08:00 AM */}
                  <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid var(--border-glass)", minHeight: "100px" }}>
                    <div style={{ padding: "16px", fontSize: "12px", color: "var(--text-secondary)", background: "rgba(29, 10, 39, 0.02)", display: "flex", alignItems: "center" }}>
                      08:00 AM
                    </div>
                    <div style={{ padding: "8px" }}>
                      <Card style={{ padding: "10px", background: "hsla(328, 100%, 54%, 0.05)", borderLeft: "4px solid var(--color-accent)" }}>
                        <h4 style={{ fontSize: "12px", fontWeight: 700 }}>Grade 10 Algebra</h4>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Prof. Aaron</span>
                      </Card>
                    </div>
                    <div style={{ padding: "8px" }}></div>
                    <div style={{ padding: "8px" }}>
                      <Card style={{ padding: "10px", background: "hsla(328, 100%, 54%, 0.05)", borderLeft: "4px solid var(--color-accent)" }}>
                        <h4 style={{ fontSize: "12px", fontWeight: 700 }}>Grade 10 Algebra</h4>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Prof. Aaron</span>
                      </Card>
                    </div>
                    <div style={{ padding: "8px" }}></div>
                    <div style={{ padding: "8px" }}></div>
                  </div>

                  {/* Row 2: 10:00 AM */}
                  <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid var(--border-glass)", minHeight: "100px" }}>
                    <div style={{ padding: "16px", fontSize: "12px", color: "var(--text-secondary)", background: "rgba(29, 10, 39, 0.02)", display: "flex", alignItems: "center" }}>
                      10:00 AM
                    </div>
                    <div style={{ padding: "8px" }}></div>
                    <div style={{ padding: "8px" }}>
                      <Card style={{ padding: "10px", background: "hsla(142, 70%, 40%, 0.05)", borderLeft: "4px solid var(--color-success)" }}>
                        <h4 style={{ fontSize: "12px", fontWeight: 700 }}>Grade 8 Physics</h4>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Prof. Bruce</span>
                      </Card>
                    </div>
                    <div style={{ padding: "8px" }}></div>
                    <div style={{ padding: "8px" }}>
                      <Card style={{ padding: "10px", background: "hsla(142, 70%, 40%, 0.05)", borderLeft: "4px solid var(--color-success)" }}>
                        <h4 style={{ fontSize: "12px", fontWeight: 700 }}>Grade 8 Physics</h4>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Prof. Bruce</span>
                      </Card>
                    </div>
                    <div style={{ padding: "8px" }}></div>
                  </div>

                </div>
              </Card>
            )}
          </div>
        )}

        {/* ==========================================
            VIEW: BILLING INVOICE
            ========================================== */}
        {currentView === "billing" && (
          <div className="animate-fade-in">
            <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div>
                <h1 className="text-gradient-indigo">Billing & Fee Ledger</h1>
                <p>Manage invoicing templates, Stripe checkout portals, and student logs.</p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <Button variant="secondary" leftIcon={<Filter size={16} />}>Filter</Button>
                <Button variant="primary" leftIcon={<Plus size={16} />}>Issue Invoice</Button>
              </div>
            </section>

            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Skeleton variant="rect" height={60} />
                <Skeleton variant="rect" height={60} />
                <Skeleton variant="rect" height={60} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Invoice item 1 */}
                <Card style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Invoice #INV-2026-001</span>
                      <h3 style={{ margin: "4px 0" }}>John Connor</h3>
                      <p style={{ fontSize: "12px" }}>Billing Period: July 2026 — Grade 10 Algebra</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Outstanding Amount</span>
                        <h3 className="text-gradient-sunset" style={{ fontSize: "22px", fontWeight: 700 }}>$150.00</h3>
                      </div>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "hsla(342, 90%, 48%, 0.1)",
                        color: "var(--color-danger)"
                      }}>
                        Unpaid
                      </span>
                      <Button variant="primary" size="sm">Pay via Stripe</Button>
                    </div>
                  </div>
                </Card>

                {/* Invoice item 2 */}
                <Card style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Invoice #INV-2026-002</span>
                      <h3 style={{ margin: "4px 0" }}>Marcus Wright</h3>
                      <p style={{ fontSize: "12px" }}>Billing Period: July 2026 — Grade 8 Physics</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Paid Amount</span>
                        <h3 className="text-gradient-emerald" style={{ fontSize: "22px", fontWeight: 700 }}>$120.00</h3>
                      </div>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "hsla(142, 70%, 40%, 0.1)",
                        color: "var(--color-success)"
                      }}>
                        Paid
                      </span>
                      <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={14} />}>View PDF</Button>
                    </div>
                  </div>
                </Card>

              </div>
            )}
          </div>
        )}

        {/* ==========================================
            VIEW: CRM STAFF & ROLES DIRECTORY (21st.dev Upgraded)
            ========================================== */}
        {currentView === "staff" && (
          <div className="animate-fade-in">
            {/* Header section */}
            <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div>
                <h1 className="text-gradient-indigo">Staff & Roles Directory</h1>
                <p>Expose and audit academic, management, financial, sales, and support rosters.</p>
              </div>
              <Button variant="primary" leftIcon={<Plus size={16} />}>Register Staff</Button>
            </section>

            {/* Sidebar + Main Grid Layout */}
            <div className="staff-layout-grid">
              
              {/* Sidebar Filters */}
              <Card className="staff-sidebar-card">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                  <Filter size={14} />
                  <span>Departments</span>
                </div>
                
                <button 
                  className={`staff-filter-btn ${activeStaffFilter === "ALL" ? "is-active" : ""}`}
                  onClick={() => setActiveStaffFilter("ALL")}
                >
                  <Activity size={15} />
                  <span>All Staff ({staffList.length})</span>
                </button>

                <button 
                  className={`staff-filter-btn ${activeStaffFilter === "ADMIN" ? "is-active" : ""}`}
                  onClick={() => setActiveStaffFilter("ADMIN")}
                >
                  <Sparkles size={15} style={{ color: "var(--color-warning)" }} />
                  <span>Admissions Admin ({staffList.filter(s => s.role === "ADMIN").length})</span>
                </button>

                <button 
                  className={`staff-filter-btn ${activeStaffFilter === "TEACHER" ? "is-active" : ""}`}
                  onClick={() => setActiveStaffFilter("TEACHER")}
                >
                  <GraduationCap size={15} style={{ color: "var(--color-success)" }} />
                  <span>Academic Teachers ({staffList.filter(s => s.role === "TEACHER").length})</span>
                </button>

                <button 
                  className={`staff-filter-btn ${activeStaffFilter === "SALES" ? "is-active" : ""}`}
                  onClick={() => setActiveStaffFilter("SALES")}
                >
                  <Users2 size={15} style={{ color: "var(--color-accent)" }} />
                  <span>Admissions Advisors ({staffList.filter(s => s.role === "SALES").length})</span>
                </button>

                <button 
                  className={`staff-filter-btn ${activeStaffFilter === "BILLING" ? "is-active" : ""}`}
                  onClick={() => setActiveStaffFilter("BILLING")}
                >
                  <DollarSign size={15} style={{ color: "hsl(38, 92%, 45%)" }} />
                  <span>Finance Officers ({staffList.filter(s => s.role === "BILLING").length})</span>
                </button>

                <button 
                  className={`staff-filter-btn ${activeStaffFilter === "SUPPORT" ? "is-active" : ""}`}
                  onClick={() => setActiveStaffFilter("SUPPORT")}
                >
                  <Briefcase size={15} style={{ color: "var(--color-info)" }} />
                  <span>IT Operations ({staffList.filter(s => s.role === "SUPPORT").length})</span>
                </button>
              </Card>

              {/* Main Directory Cards Area */}
              <div>
                {isLoading ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    <Skeleton variant="rect" height={180} />
                    <Skeleton variant="rect" height={180} />
                    <Skeleton variant="rect" height={180} />
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                    {filteredStaff.map(staff => (
                      <Card key={staff.id} hoverLift style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Member Header */}
                        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
                          <div className={`avatar-initials-gradient ${staff.avatarClass}`}>
                            {staff.initials}
                          </div>
                          <div style={{ flexGrow: 1 }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{staff.name}</h3>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>{staff.title}</span>
                          </div>
                        </div>

                        {/* Specific Assignment info */}
                        <div style={{ flexGrow: 1, padding: "10px 12px", background: "rgba(29, 10, 39, 0.02)", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "16px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                            Current Directives
                          </span>
                          <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.4, margin: 0 }}>
                            {staff.assignment}
                          </p>
                        </div>

                        {/* Member Footer Details */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-glass)", paddingTop: "12px", marginTop: "auto" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: staff.status === "Offline" ? "var(--text-secondary)" : staff.status === "In Class" ? "var(--color-warning)" : "var(--color-success)"
                            }} />
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{staff.status}</span>
                          </div>
                          
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Button variant="ghost" size="sm" style={{ width: "30px", height: "30px", padding: 0 }} aria-label="Call member">
                              <Phone size={14} style={{ color: "var(--text-secondary)" }} />
                            </Button>
                            <Button variant="ghost" size="sm" style={{ width: "30px", height: "30px", padding: 0 }} aria-label="Message member">
                              <MessageSquare size={14} style={{ color: "var(--text-secondary)" }} />
                            </Button>
                            <span className={`role-badge ${staff.badgeClass}`}>
                              {staff.role}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
