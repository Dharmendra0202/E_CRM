import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/Card";
import { Skeleton } from "./components/ui/Skeleton";
import { Toggle } from "./components/ui/Toggle";
import { supabase } from "./utils/supabaseClient";
import { Login } from "./components/Login";
import { StudentManagement } from "./components/StudentManagement";
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

type ViewType = "dashboard" | "leads" | "schedule" | "billing" | "staff" | "attendance";
type StaffRoleType = "ALL" | "ADMIN" | "TEACHER" | "SALES" | "BILLING" | "SUPPORT";

function App() {
  // Authentication & Session States
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

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

  // Leads CRM State (dynamic from Supabase)
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");

  // CRM Staff Profiles State (dynamic from Supabase)
  const [staffList, setStaffList] = useState<any[]>([]);

  // Attendance Tracker States
  const [selectedBatch, setSelectedBatch] = useState("Grade 10 Algebra");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [absenceAlertChecked, setAbsenceAlertChecked] = useState(true);
  const [attendanceNotificationText, setAttendanceNotificationText] = useState("");
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  // Load Leads from Supabase
  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (data) {
        setLeadsList(data);
      }
    } catch (err) {
      console.error("Error fetching leads from Supabase:", err);
      // Fallback list
      setLeadsList([
        { id: "1", name: "Alice Cooper", email: "alice@rock.com", phone: "+1555001", status: "NEW", source: "Facebook Ad" },
        { id: "2", name: "John Connor", email: "jconnor@sky.net", phone: "+1555002", status: "CONTACTED", source: "Referral" },
        { id: "3", name: "Sarah Connor", email: "sconnor@sky.net", phone: "+1555003", status: "DEMO", source: "Web Form" },
        { id: "4", name: "Marcus Wright", email: "mwright@cyber.com", phone: "+1555004", status: "ENROLLED", source: "Google Search" }
      ]);
    }
  };

  // Load Staff from Supabase
  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      if (data && data.length > 0) {
        const formatted = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          initials: s.initials,
          role: s.role,
          title: s.title,
          email: s.email,
          phone: s.phone,
          status: s.status,
          assignment: s.assignment,
          avatarClass: s.avatar_class,
          badgeClass: s.badge_class
        }));
        setStaffList(formatted);
      } else {
        loadMockStaff();
      }
    } catch (err) {
      console.error("Error fetching staff from Supabase:", err);
      loadMockStaff();
    }
  };

  const loadMockStaff = () => {
    setStaffList([
      { id: "s1", name: "Dharmendra Admin", initials: "DA", role: "ADMIN", title: "Super Administrator", email: "dharmendra@ecrm.com", phone: "+1555101", status: "Online", assignment: "Database Audits, Access Controls", avatarClass: "avatar-admin", badgeClass: "role-badge-admin" },
      { id: "s2", name: "Sarah Jenkins", initials: "SJ", role: "ADMIN", title: "Admissions Registrar", email: "sjenkins@ecrm.com", phone: "+1555102", status: "Online", assignment: "Student Rosters, Batch Placement", avatarClass: "avatar-admin", badgeClass: "role-badge-admin" },
      { id: "s3", name: "Prof. Aaron Carter", initials: "AC", role: "TEACHER", title: "Mathematics Head — Ph.D.", email: "acarter@ecrm.com", phone: "+1555103", status: "In Class", assignment: "Grade 10 Algebra, Calculus Advanced", avatarClass: "avatar-teacher", badgeClass: "role-badge-teacher" },
      { id: "s4", name: "Prof. Bruce Banner", initials: "BB", role: "TEACHER", title: "Physics Instructor — M.Sc.", email: "bbanner@ecrm.com", phone: "+1555104", status: "On Break", assignment: "Grade 8 Mechanics, Thermal Dynamics", avatarClass: "avatar-teacher", badgeClass: "role-badge-teacher" },
      { id: "s5", name: "Clara Oswald", initials: "CO", role: "SALES", title: "Senior Admissions Advisor", email: "coswald@ecrm.com", phone: "+1555105", status: "Online", assignment: "Lead Pipeline Audits, Parent Consultation", avatarClass: "avatar-sales", badgeClass: "role-badge-sales" },
      { id: "s6", name: "Tony Stark", initials: "TS", role: "BILLING", title: "Finance Controller", email: "tstark@ecrm.com", phone: "+1555106", status: "Offline", assignment: "Stripe Reconciliations, Billing Overdues", avatarClass: "avatar-billing", badgeClass: "role-badge-billing" },
      { id: "s7", name: "Peter Parker", initials: "PP", role: "SUPPORT", title: "IT Support Technician", email: "pparker@ecrm.com", phone: "+1555107", status: "Online", assignment: "Vite Bundles, Database Backups", avatarClass: "avatar-support", badgeClass: "role-badge-support" }
    ]);
  };

  // Add Lead to Database
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) return;
    const email = newLeadEmail || "no-email@inquiry.com";

    try {
      const { data, error } = await supabase
        .from("leads")
        .insert([{
          name: newLeadName,
          email: email,
          phone: "+1555099",
          status: "NEW",
          source: "Manual Entry"
        }])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setLeadsList([data[0], ...leadsList]);
      } else {
        const fallback = { id: Date.now().toString(), name: newLeadName, email, phone: "+1555099", status: "NEW", source: "Manual Entry" };
        setLeadsList([fallback, ...leadsList]);
      }
    } catch (err) {
      console.error("Error inserting lead to Supabase:", err);
      const fallback = { id: Date.now().toString(), name: newLeadName, email, phone: "+1555099", status: "NEW", source: "Manual Entry" };
      setLeadsList([fallback, ...leadsList]);
    }
    
    setNewLeadName("");
    setNewLeadEmail("");
  };

  // Update Lead Status in Database
  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      if (!leadId.includes("-") && leadId.length < 5) {
        setLeadsList(leadsList.map(l => l.id === leadId ? {...l, status: newStatus} : l));
        return;
      }

      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;
      setLeadsList(leadsList.map(l => l.id === leadId ? {...l, status: newStatus} : l));
    } catch (err) {
      console.error("Error updating lead status in Supabase:", err);
      setLeadsList(leadsList.map(l => l.id === leadId ? {...l, status: newStatus} : l));
    }
  };

  // Switch roster items when batch filter updates
  useEffect(() => {
    if (selectedBatch === "Grade 10 Algebra") {
      setAttendanceList([
        { id: "a1", name: "Alice Connor", initials: "AC", email: "aconnor@gmail.com", rate: "96%", status: "PRESENT", remarks: "" },
        { id: "a2", name: "Tommy Miller", initials: "TM", email: "tmiller@gmail.com", rate: "92%", status: "PRESENT", remarks: "" },
        { id: "a3", name: "John Smith", initials: "JS", email: "jsmith@gmail.com", rate: "84%", status: "PRESENT", remarks: "" },
        { id: "a4", name: "Emma Watson", initials: "EW", email: "ewatson@gmail.com", rate: "100%", status: "PRESENT", remarks: "" }
      ]);
    } else if (selectedBatch === "Grade 8 Physics") {
      setAttendanceList([
        { id: "p1", name: "Bruce Stark", initials: "BS", email: "bstark@gmail.com", rate: "88%", status: "PRESENT", remarks: "" },
        { id: "p2", name: "Peter Banner", initials: "PB", email: "pbanner@gmail.com", rate: "95%", status: "PRESENT", remarks: "" },
        { id: "p3", name: "Marcus Carter", initials: "MC", email: "mcarter@gmail.com", rate: "91%", status: "PRESENT", remarks: "" }
      ]);
    }
  }, [selectedBatch]);

  // Toggle Single Attendance Button
  const handleToggleAttendance = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setAttendanceList(attendanceList.map(s => s.id === studentId ? { ...s, status } : s));
  };

  // Update Remarks Text
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceList(attendanceList.map(s => s.id === studentId ? { ...s, remarks } : s));
  };

  // Submit and Sync Attendance Sheets
  const handleSaveAttendance = async () => {
    setBtnLoading(true);
    try {
      const records = attendanceList.map(s => ({
        student_id: s.id.includes("-") ? s.id : null,
        class_date: selectedDate,
        status: s.status,
        remarks: s.remarks || ""
      }));

      const uuidRecords = records.filter(r => r.student_id !== null);
      if (uuidRecords.length > 0) {
        await supabase.from("attendance").insert(uuidRecords);
      }

      const absentCount = attendanceList.filter(s => s.status === "ABSENT").length;
      let msg = `Successfully logged attendance for ${attendanceList.length} students.`;
      if (absentCount > 0 && absenceAlertChecked) {
        msg += ` Sent SMS/Email absence alerts to ${absentCount} parents.`;
      }

      setAttendanceNotificationText(msg);

      setTimeout(() => {
        setAttendanceNotificationText("");
      }, 5000);
    } catch (err) {
      console.error("Error saving attendance:", err);
      setAttendanceNotificationText("Failed to log attendance. Please try again.");
    }
    setBtnLoading(false);
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

  // Handle Auth Session loading on Mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUserProfile(session.user);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Database entities once session changes to authenticated
  useEffect(() => {
    if (userProfile) {
      fetchLeads();
      fetchStaff();
    }
  }, [userProfile]);

  // Simulate loader on navigation
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [currentView]);

  // Filtered Staff Logic
  const filteredStaff = activeStaffFilter === "ALL" 
    ? staffList 
    : staffList.filter(s => s.role === activeStaffFilter);

  const userInitials = userProfile?.user_metadata?.name
    ? userProfile.user_metadata.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : userProfile?.email
    ? userProfile.email.substring(0, 2).toUpperCase()
    : "DA";

  const userName = userProfile?.user_metadata?.name || userProfile?.email?.split("@")[0] || "Dharmendra Admin";
  const userRole = userProfile?.user_metadata?.role || "Super Administrator";

  if (!userProfile) {
    return <Login onLoginSuccess={(u) => setUserProfile(u)} />;
  }

  return (
    <div className="crm-container relative overflow-hidden">
      {/* Spotlight effect overlay */}
      <div className="radial-spotlight" />

      {/* Frosted Glass macOS-style Floating Bottom Dock */}
      <nav className="crm-bottom-dock">
        <button
          className={`crm-dock-item ${currentView === "dashboard" ? "is-active" : ""}`}
          onClick={() => setCurrentView("dashboard")}
        >
          <LayoutDashboard size={20} />
          <span className="crm-dock-tooltip">Dashboard</span>
        </button>

        <button
          className={`crm-dock-item ${currentView === "leads" ? "is-active" : ""}`}
          onClick={() => setCurrentView("leads")}
        >
          <Users2 size={20} />
          <span className="crm-dock-tooltip">Students</span>
        </button>

        <button
          className={`crm-dock-item ${currentView === "schedule" ? "is-active" : ""}`}
          onClick={() => setCurrentView("schedule")}
        >
          <CalendarDays size={20} />
          <span className="crm-dock-tooltip">Timetable</span>
        </button>

        <button
          className={`crm-dock-item ${currentView === "attendance" ? "is-active" : ""}`}
          onClick={() => setCurrentView("attendance")}
        >
          <Check size={20} />
          <span className="crm-dock-tooltip">Attendance</span>
        </button>

        <button
          className={`crm-dock-item ${currentView === "billing" ? "is-active" : ""}`}
          onClick={() => setCurrentView("billing")}
        >
          <CreditCard size={20} />
          <span className="crm-dock-tooltip">Billing Invoice</span>
        </button>

        <button
          className={`crm-dock-item ${currentView === "staff" ? "is-active" : ""}`}
          onClick={() => setCurrentView("staff")}
        >
          <Briefcase size={20} />
          <span className="crm-dock-tooltip">Staff Roster</span>
        </button>
      </nav>

      {/* 2. Main content area viewport wrapper on the right */}
      <div className="crm-main-content">
        
        {/* Top Slim utility bar (Search box, notification bell, profile trigger) */}
        <header className="crm-top-header">
          {/* Logo & Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <GraduationCap size={28} className="text-gradient-indigo" style={{ color: "var(--color-accent)" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }} className="text-gradient-indigo">E-CRM Portal</h2>
            <span className="navbar-logo-badge">PRO</span>
          </div>

          {/* Centered Search Box */}
          <div className="navbar-search-box" style={{ display: "flex", width: "300px", background: "rgba(29, 10, 39, 0.03)" }}>
            <Search size={16} style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              placeholder="Search directory..."
              className="navbar-search-input"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* Action Controls & Profile Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                <div className="navbar-avatar-circle">{userInitials}</div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="navbar-profile-dropdown" style={{ top: "45px" }}>
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{userName}</div>
                    <div className="dropdown-user-role">{userRole}</div>
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

                  <div style={{ padding: "6px 12px" }}>
                    <Toggle
                      label="Simulate Loading"
                      checked={isLoading}
                      onChange={(e) => { setIsLoading(e.target.checked); setIsProfileOpen(false); }}
                      style={{ marginBottom: 0 }}
                    />
                  </div>

                  <hr style={{ border: 0, borderTop: "1px solid var(--border-glass)", margin: "4px 0" }} />

                  <button
                    className="dropdown-item dropdown-item-danger"
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await supabase.auth.signOut();
                      setUserProfile(null);
                      setSession(null);
                    }}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Drawer Toggle (Only visible under 900px) */}
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

          {/* ==========================================
              MOBILE NAVIGATION DRAWER (Top-Slide down on mobile viewports)
              ========================================== */}
          <nav className={`top-drawer ${isMenuOpen ? "is-open" : ""}`} style={{ top: "70px" }}>
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
                <span>Students</span>
              </button>
              <button
                className={`drawer-nav-item ${currentView === "schedule" ? "is-active" : ""}`}
                onClick={() => { setCurrentView("schedule"); setIsMenuOpen(false); }}
              >
                <div className="drawer-icon-box"><CalendarDays size={20} /></div>
                <span>Timetable</span>
              </button>
              <button
                className={`drawer-nav-item ${currentView === "attendance" ? "is-active" : ""}`}
                onClick={() => { setCurrentView("attendance"); setIsMenuOpen(false); }}
              >
                <div className="drawer-icon-box"><Check size={20} /></div>
                <span>Attendance</span>
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

        {/* 3. Independent Scrollable Viewport Panel */}
        <div className="crm-viewport">

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
                  Bespoke design widgets styled directly inside a single <code>main.css</code> file. Use the left sidebar menu to explore page views.
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
                        <h2 style={{ fontSize: "36px", marginTop: "4px" }}>458</h2>
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
                        <h2 style={{ fontSize: "36px", marginTop: "4px" }} className="text-gradient-emerald">₹1,28,500</h2>
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
                          <span style={{ fontSize: "12px", color: "var(--color-success)", fontWeight: 600 }}>8 Registered</span>
                        </div>
                        <p style={{ fontSize: "13px", fontWeight: 550, color: "var(--text-secondary)" }}>Average Attendance Rate</p>
                        <h2 style={{ fontSize: "36px", marginTop: "4px" }}>94.2%</h2>
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
              VIEW: STUDENT MANAGEMENT HUB
              ========================================== */}
          {currentView === "leads" && (
            <StudentManagement />
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
              VIEW: ATTENDANCE TRACKER SYSTEM
              ========================================== */}
          {currentView === "attendance" && (
            <div className="animate-fade-in">
              {/* Page Header */}
              <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div>
                  <h1 className="text-gradient-indigo">Attendance Tracker</h1>
                  <p>Select a class batch and date to log student attendance and update progress.</p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 650, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Activity size={14} style={{ color: "var(--color-success)" }} />
                    Rate: 93.8% (Week)
                  </span>
                </div>
              </section>

              {/* Notification Banner */}
              {attendanceNotificationText && (
                <div style={{
                  background: "hsla(142, 70%, 40%, 0.08)",
                  border: "1px solid hsla(142, 70%, 40%, 0.2)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "var(--color-success)",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "24px"
                }}>
                  <Check size={18} />
                  <span>{attendanceNotificationText}</span>
                </div>
              )}

              {/* Selector Filters Card */}
              <Card style={{ marginBottom: "28px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-end" }}>
                  <div style={{ flexGrow: 1, minWidth: "200px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      Select Class Batch
                    </label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-glass)",
                        background: "var(--surface-glass)",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        fontWeight: 600,
                        outline: "none"
                      }}
                    >
                      <option value="Grade 10 Algebra">Grade 10 Algebra A (Mathematics)</option>
                      <option value="Grade 8 Physics">Grade 8 Physics B (Physics)</option>
                    </select>
                  </div>

                  <div style={{ width: "200px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      Class Session Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-glass)",
                        background: "var(--surface-glass)",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        fontWeight: 600,
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", height: "42px", paddingLeft: "10px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={absenceAlertChecked}
                        onChange={(e) => setAbsenceAlertChecked(e.target.checked)}
                        style={{
                          width: "16px",
                          height: "16px",
                          accentColor: "var(--color-accent)",
                          cursor: "pointer"
                        }}
                      />
                      <span>Auto-Notify Parents on Absence</span>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Attendance Roster Grid */}
              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Skeleton variant="rect" height={60} />
                  <Skeleton variant="rect" height={60} />
                  <Skeleton variant="rect" height={60} />
                </div>
              ) : (
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  {/* Roster Header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 200px 300px",
                    padding: "16px 24px",
                    background: "rgba(29, 10, 39, 0.02)",
                    borderBottom: "1px solid var(--border-glass)",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "var(--text-secondary)"
                  }}>
                    <div>Student Name</div>
                    <div style={{ textAlign: "center" }}>Mark Attendance</div>
                    <div>Remarks / Comments</div>
                  </div>

                  {/* Roster List */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {attendanceList.map(student => (
                      <div
                        key={student.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 200px 300px",
                          padding: "16px 24px",
                          borderBottom: "1px solid var(--border-glass)",
                          alignItems: "center"
                        }}
                      >
                        {/* 1. Student Name/Metadata */}
                        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                          <div className="avatar-initials-gradient avatar-support" style={{ width: "38px", height: "38px", fontSize: "13px" }}>
                            {student.initials}
                          </div>
                          <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 650, margin: 0 }}>{student.name}</h4>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                              Email: {student.email} • avg: <strong style={{ color: "var(--color-success)" }}>{student.rate}</strong>
                            </span>
                          </div>
                        </div>

                        {/* 2. Toggle Status buttons */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <div className="attendance-btn-group">
                            <button
                              type="button"
                              className={`attendance-btn attendance-btn-present ${student.status === "PRESENT" ? "is-active" : ""}`}
                              onClick={() => handleToggleAttendance(student.id, "PRESENT")}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              className={`attendance-btn attendance-btn-absent ${student.status === "ABSENT" ? "is-active" : ""}`}
                              onClick={() => handleToggleAttendance(student.id, "ABSENT")}
                            >
                              A
                            </button>
                            <button
                              type="button"
                              className={`attendance-btn attendance-btn-late ${student.status === "LATE" ? "is-active" : ""}`}
                              onClick={() => handleToggleAttendance(student.id, "LATE")}
                            >
                              L
                            </button>
                          </div>
                        </div>

                        {/* 3. Remarks Input */}
                        <div>
                          <input
                            type="text"
                            placeholder="Log absence note or behavioral comment..."
                            value={student.remarks}
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-glass)",
                              background: "transparent",
                              fontSize: "12px",
                              outline: "none",
                              color: "var(--text-primary)"
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Controls */}
                  <div style={{
                    padding: "16px 24px",
                    background: "rgba(29, 10, 39, 0.01)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Selected Date: <strong>{selectedDate}</strong> • Selected Batch: <strong>{selectedBatch}</strong>
                    </span>
                    <Button
                      variant="primary"
                      isLoading={btnLoading}
                      onClick={handleSaveAttendance}
                      leftIcon={<Check size={16} />}
                    >
                      Save Attendance Records
                    </Button>
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

        </div>
      </div>
    </div>
  );
}

export default App;
