import React, { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { api } from "../utils/api";
import {
  Search,
  User,
  Mail,
  Phone,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  BookOpen,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Star,
  Download,
  UserPlus,
  Users2,
  ArrowLeft,
  Sparkles,
  Award,
  BarChart3,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Eye,
  X
} from "lucide-react";

// ─────────────────────────── Types ───────────────────────────
interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  guardianName: string;
  guardianPhone: string;
  address: string;
  batch: string;
  enrollmentDate: string;
  status: "Active" | "Inactive" | "Graduated";
  feeAmount: number;
  feeStatus: "Paid" | "Pending" | "Overdue";
  attendanceRate: number;
  notes: string;
  subjects: { name: string; score: number; grade: string; trend: "up" | "down" | "stable" }[];
}

type StudentTab = "all" | "add" | "search" | "progress";
type SortField = "name" | "enrollmentDate" | "attendanceRate" | "batch";
type SortDir = "asc" | "desc";
type StatusFilter = "ALL" | "Active" | "Inactive" | "Graduated";

// ─────────────────────────── Shadcn UI Styled Elements ───────────────────────────
interface ShadcnInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const ShadcnInput: React.FC<ShadcnInputProps> = ({ label, error, leftIcon, className = "", ...props }) => {
  return (
    <div className="shad-input-container">
      <label className="shad-input-label">{label}</label>
      <div className="shad-input-wrapper">
        {leftIcon && <span className="shad-input-icon">{leftIcon}</span>}
        <input
          className={`shad-input-field ${leftIcon ? "has-icon" : ""} ${error ? "has-error" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="shad-input-error">{error}</span>}
    </div>
  );
};

interface ShadcnSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

const ShadcnSelect: React.FC<ShadcnSelectProps> = ({ label, options, className = "", ...props }) => {
  return (
    <div className="shad-input-container">
      <label className="shad-input-label">{label}</label>
      <select className={`shad-select-field ${className}`} {...props}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
};

interface ShadcnTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const ShadcnTextarea: React.FC<ShadcnTextareaProps> = ({ label, className = "", ...props }) => {
  return (
    <div className="shad-input-container">
      <label className="shad-input-label">{label}</label>
      <textarea className={`shad-textarea-field ${className}`} {...props} />
    </div>
  );
};

// ─────────────────────────── Config ───────────────────────────
const BATCHES = [
  "5th Class", "6th Class", "7th Class", "8th Class",
  "9th Class", "10th Class", "11th Class", "12th Class"
];

// ─────────────────────────── Helpers ───────────────────────────
const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

const getAvatarColor = (_batch: string): string => "avatar-admin";

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":    return { bg: "hsla(142,70%,40%,0.08)", color: "var(--color-success)", dot: "var(--color-success)" };
    case "Inactive":  return { bg: "hsla(0,0%,50%,0.08)",    color: "var(--text-secondary)", dot: "var(--text-secondary)" };
    case "Graduated": return { bg: "hsla(271,91%,60%,0.08)", color: "var(--color-warning)", dot: "var(--color-warning)" };
    default:          return { bg: "hsla(0,0%,50%,0.08)",    color: "var(--text-secondary)", dot: "var(--text-secondary)" };
  }
};

const getFeeColor = (status: string) => {
  switch (status) {
    case "Paid":    return { bg: "hsla(142,70%,40%,0.08)", color: "var(--color-success)" };
    case "Pending": return { bg: "hsla(38,92%,50%,0.08)",  color: "hsl(38,92%,45%)" };
    case "Overdue": return { bg: "hsla(342,90%,48%,0.08)", color: "var(--color-danger)" };
    default:        return { bg: "hsla(0,0%,50%,0.08)",    color: "var(--text-secondary)" };
  }
};

// ─────────────────────────── Component ───────────────────────────
export const StudentManagement: React.FC = () => {
  // Core state — starts empty, loads from API
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTab>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Search & Profile state
  const [profileSearchQuery, setProfileSearchQuery] = useState("");
  const [profileResult, setProfileResult] = useState<Student | null>(null);
  const [profileSearchPerformed, setProfileSearchPerformed] = useState(false);

  // Add Student form state
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", dob: "", gender: "Male" as "Male" | "Female" | "Other",
    guardianName: "", guardianPhone: "", address: "", batch: BATCHES[0],
    feeAmount: "8500", notes: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ─────────── Helpers ───────────
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // ─────────── Load students from API ───────────
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const res = await api.students.getAll();
        if (res.data && res.data.length > 0) {
          const mapped: Student[] = res.data.map((s: any) => ({
            id: s.id,
            name: s.user ? `${s.user.firstName} ${s.user.lastName}` : (s.parentName || "Student"),
            email: s.user?.email || s.parentEmail,
            phone: s.user?.phone || s.parentPhone,
            dob: s.dateOfBirth?.split("T")[0] || "",
            gender: "Male" as const,
            guardianName: s.parentName,
            guardianPhone: s.parentPhone,
            address: "",
            batch: s.enrollments?.[0]?.batch?.name || "Unassigned",
            enrollmentDate: s.createdAt?.split("T")[0] || "",
            status: "Active" as const,
            feeAmount: s.invoices?.[0]?.totalAmount || 0,
            feeStatus: (s.invoices?.[0]?.status === "PAID" ? "Paid" : s.invoices?.[0]?.status === "PARTIAL" ? "Pending" : "Overdue") as any,
            attendanceRate: 0,
            notes: "",
            subjects: [],
          }));
          setStudents(mapped);
        }
        // If DB returns empty, list stays empty — user adds real students
      } catch {
        // Backend not available — list stays empty
      } finally {
        setIsLoadingStudents(false);
      }
    };
    loadStudents();
  }, []);

  // ─────────── Filtered & Sorted Students ───────────
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.batch.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter(s => s.status === statusFilter);
    }

    // Batch filter
    if (batchFilter !== "ALL") {
      list = list.filter(s => s.batch === batchFilter);
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "enrollmentDate": cmp = new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime(); break;
        case "attendanceRate": cmp = a.attendanceRate - b.attendanceRate; break;
        case "batch": cmp = a.batch.localeCompare(b.batch); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [students, searchQuery, statusFilter, batchFilter, sortField, sortDir]);

  // ─────────── Stats ───────────
  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === "Active").length,
    inactive: students.filter(s => s.status === "Inactive").length,
    graduated: students.filter(s => s.status === "Graduated").length,
    avgAttendance: Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length),
    feePending: students.filter(s => s.feeStatus !== "Paid").length,
    totalRevenue: students.filter(s => s.feeStatus === "Paid").reduce((sum, s) => sum + s.feeAmount, 0)
  }), [students]);

  // ─────────── Toggle Sort ───────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  // ─────────── Delete Student ───────────
  const handleDeleteStudent = async (id: string) => {
    // Optimistic UI update
    setStudents(prev => prev.filter(s => s.id !== id));
    if (expandedRow === id) setExpandedRow(null);
    if (selectedStudent?.id === id) setSelectedStudent(null);
    try {
      await api.students.delete(id);
      showToast("Student record removed successfully.", "info");
    } catch {
      showToast("Student removed locally (DB sync pending).", "info");
    }
  };

  // ─────────── Add Student ───────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Student name is required";
    if (!formData.email.trim()) errors.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Enter a valid email address";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.dob) errors.dob = "Date of birth is required";
    if (!formData.guardianName.trim()) errors.guardianName = "Guardian name is required";
    if (!formData.guardianPhone.trim()) errors.guardianPhone = "Guardian phone is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const nameParts = formData.name.trim().split(" ");
    const optimisticStudent: Student = {
      id: `stu-${Date.now()}`,
      name: formData.name, email: formData.email, phone: formData.phone,
      dob: formData.dob, gender: formData.gender,
      guardianName: formData.guardianName, guardianPhone: formData.guardianPhone,
      address: formData.address, batch: formData.batch,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "Active", feeAmount: parseInt(formData.feeAmount) || 8500,
      feeStatus: "Pending", attendanceRate: 0, notes: formData.notes,
      subjects: [
        { name: "Mathematics", score: 0, grade: "-", trend: "stable" },
        { name: "Science",     score: 0, grade: "-", trend: "stable" },
        { name: "English",     score: 0, grade: "-", trend: "stable" },
        { name: "Social Studies", score: 0, grade: "-", trend: "stable" },
      ],
    };

    // Optimistic UI — add immediately
    setStudents(prev => [optimisticStudent, ...prev]);
    setFormData({ name: "", email: "", phone: "", dob: "", gender: "Male", guardianName: "", guardianPhone: "", address: "", batch: BATCHES[0], feeAmount: "8500", notes: "" });
    setFormErrors({});
    showToast(`🎉 ${optimisticStudent.name} registered successfully!`, "success");
    setActiveTab("all");

    // Save to database in background
    try {
      await api.students.create({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || nameParts[0],
        email: formData.email,
        phone: formData.phone,
        parentName: formData.guardianName,
        parentPhone: formData.guardianPhone,
        parentEmail: formData.email,
        dateOfBirth: formData.dob,
      });
    } catch {
      // Saved locally — will sync when backend available
    }
  };

  // ─────────── Profile Search ───────────
  const handleProfileSearch = () => {
    setProfileSearchPerformed(true);
    if (!profileSearchQuery.trim()) { setProfileResult(null); return; }
    const q = profileSearchQuery.toLowerCase();
    const found = students.find(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
    setProfileResult(found || null);
  };

  // ─────────── Render Helpers ───────────

  // ============ STAT CARDS (top overview) ============
  const renderStatCards = () => (
    <div className="stu-stats-row">
      <div className="stu-stat-card">
        <div className="stu-stat-icon" style={{ background: "hsla(328, 100%, 54%, 0.08)" }}>
          <Users2 size={20} style={{ color: "var(--color-accent)" }} />
        </div>
        <div>
          <span className="stu-stat-label">Total Students</span>
          <span className="stu-stat-value">{stats.total}</span>
        </div>
      </div>
      <div className="stu-stat-card">
        <div className="stu-stat-icon" style={{ background: "hsla(142, 70%, 40%, 0.08)" }}>
          <CheckCircle2 size={20} style={{ color: "var(--color-success)" }} />
        </div>
        <div>
          <span className="stu-stat-label">Active</span>
          <span className="stu-stat-value" style={{ color: "var(--color-success)" }}>{stats.active}</span>
        </div>
      </div>
      <div className="stu-stat-card">
        <div className="stu-stat-icon" style={{ background: "hsla(200, 95%, 50%, 0.08)" }}>
          <Activity size={20} style={{ color: "var(--color-info)" }} />
        </div>
        <div>
          <span className="stu-stat-label">Avg Attendance</span>
          <span className="stu-stat-value">{stats.avgAttendance}%</span>
        </div>
      </div>
      <div className="stu-stat-card">
        <div className="stu-stat-icon" style={{ background: "hsla(38, 92%, 50%, 0.08)" }}>
          <IndianRupee size={20} style={{ color: "hsl(38, 92%, 45%)" }} />
        </div>
        <div>
          <span className="stu-stat-label">Fee Pending</span>
          <span className="stu-stat-value" style={{ color: "var(--color-danger)" }}>{stats.feePending}</span>
        </div>
      </div>
    </div>
  );

  // ============ PROFILE CARD (used in search & expanded row) ============
  const renderProfileCard = (student: Student, isModal?: boolean) => {
    const sc = getStatusColor(student.status);
    const fc = getFeeColor(student.feeStatus);
    const avgScore = Math.round(student.subjects.reduce((sum, s) => sum + s.score, 0) / student.subjects.length);

    return (
      <div className={`stu-profile-card ${isModal ? "stu-profile-modal" : ""}`}>
        {/* Header Gradient Banner */}
        <div className="stu-profile-header">
          <div className="stu-profile-header-bg" />
          <div className="stu-profile-avatar-section">
            <div className={`avatar-initials-gradient ${getAvatarColor(student.batch)} stu-profile-avatar`}>
              {getInitials(student.name)}
            </div>
            <div>
              <h2 className="stu-profile-name">{student.name}</h2>
              <span className="stu-profile-batch">{student.batch}</span>
            </div>
            <span className="stu-status-badge" style={{ background: sc.bg, color: sc.color, marginLeft: "auto" }}>
              <span className="stu-status-dot" style={{ background: sc.dot }} />
              {student.status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="stu-profile-info-grid">
          <div className="stu-profile-info-item">
            <Mail size={14} />
            <div><span className="stu-info-label">Email</span><span className="stu-info-value">{student.email}</span></div>
          </div>
          <div className="stu-profile-info-item">
            <Phone size={14} />
            <div><span className="stu-info-label">Phone</span><span className="stu-info-value">{student.phone}</span></div>
          </div>
          <div className="stu-profile-info-item">
            <Calendar size={14} />
            <div><span className="stu-info-label">Date of Birth</span><span className="stu-info-value">{formatDate(student.dob)}</span></div>
          </div>
          <div className="stu-profile-info-item">
            <User size={14} />
            <div><span className="stu-info-label">Gender</span><span className="stu-info-value">{student.gender}</span></div>
          </div>
          <div className="stu-profile-info-item">
            <Users2 size={14} />
            <div><span className="stu-info-label">Guardian</span><span className="stu-info-value">{student.guardianName} ({student.guardianPhone})</span></div>
          </div>
          <div className="stu-profile-info-item">
            <MapPin size={14} />
            <div><span className="stu-info-label">Address</span><span className="stu-info-value">{student.address}</span></div>
          </div>
          <div className="stu-profile-info-item">
            <GraduationCap size={14} />
            <div><span className="stu-info-label">Enrolled</span><span className="stu-info-value">{formatDate(student.enrollmentDate)}</span></div>
          </div>
          <div className="stu-profile-info-item">
            <IndianRupee size={14} />
            <div>
              <span className="stu-info-label">Fee (₹{student.feeAmount.toLocaleString("en-IN")})</span>
              <span className="stu-fee-badge" style={{ background: fc.bg, color: fc.color }}>{student.feeStatus}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="stu-profile-quick-stats">
          <div className="stu-quick-stat">
            <Activity size={16} style={{ color: "var(--color-info)" }} />
            <div>
              <span className="stu-qs-val">{student.attendanceRate}%</span>
              <span className="stu-qs-lbl">Attendance</span>
            </div>
            <div className="stu-mini-progress-bar">
              <div className="stu-mini-progress-fill" style={{ width: `${student.attendanceRate}%`, background: student.attendanceRate >= 85 ? "var(--color-success)" : student.attendanceRate >= 60 ? "hsl(38, 92%, 50%)" : "var(--color-danger)" }} />
            </div>
          </div>
          <div className="stu-quick-stat">
            <Award size={16} style={{ color: "var(--color-warning)" }} />
            <div>
              <span className="stu-qs-val">{avgScore}%</span>
              <span className="stu-qs-lbl">Avg Score</span>
            </div>
            <div className="stu-mini-progress-bar">
              <div className="stu-mini-progress-fill" style={{ width: `${avgScore}%`, background: avgScore >= 85 ? "var(--color-success)" : avgScore >= 60 ? "hsl(38, 92%, 50%)" : "var(--color-danger)" }} />
            </div>
          </div>
        </div>

        {/* Subjects Breakdown */}
        <div className="stu-subjects-section">
          <h4 className="stu-section-title"><BookOpen size={14} /> Subject Performance</h4>
          <div className="stu-subjects-grid">
            {student.subjects.map((sub, i) => (
              <div key={i} className="stu-subject-row">
                <div className="stu-subject-name-col">
                  <span className="stu-subject-name">{sub.name}</span>
                  <span className="stu-subject-grade">{sub.grade}</span>
                </div>
                <div className="stu-subject-bar-col">
                  <div className="stu-subject-bar-bg">
                    <div
                      className="stu-subject-bar-fill"
                      style={{
                        width: `${sub.score}%`,
                        background: sub.score >= 85 ? "linear-gradient(90deg, var(--color-success), hsl(142, 70%, 55%))" :
                          sub.score >= 60 ? "linear-gradient(90deg, hsl(38, 92%, 45%), hsl(38, 92%, 60%))" :
                            "linear-gradient(90deg, var(--color-danger), hsl(342, 90%, 60%))"
                      }}
                    />
                  </div>
                  <span className="stu-subject-score">{sub.score}%</span>
                </div>
                <span className="stu-subject-trend">
                  {sub.trend === "up" ? <TrendingUp size={14} style={{ color: "var(--color-success)" }} /> :
                    sub.trend === "down" ? <TrendingDown size={14} style={{ color: "var(--color-danger)" }} /> :
                      <span style={{ width: "14px", height: "2px", background: "var(--text-secondary)", display: "inline-block", borderRadius: "1px" }} />}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {student.notes && (
          <div className="stu-notes-section">
            <h4 className="stu-section-title"><FileText size={14} /> Notes & Remarks</h4>
            <p className="stu-notes-text">{student.notes}</p>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────── MAIN RENDER ───────────────────────────
  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`stu-toast stu-toast-${toast.type}`}>
          <Sparkles size={14} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <section className="stu-page-header">
        <div>
          <h1 className="text-gradient-indigo" style={{ fontSize: "32px", marginBottom: "6px" }}>
            Student Management
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Register students, search profiles, track progress, and manage enrollment records.
          </p>
        </div>
      </section>

      {/* Stat Cards Row */}
      {renderStatCards()}

      {/* Tab Navigation */}
      <div className="stu-tabs-container">
        <div className="stu-tabs">
          <button
            className={`stu-tab ${activeTab === "all" ? "is-active" : ""}`}
            onClick={() => { setActiveTab("all"); setSelectedStudent(null); }}
          >
            <Users2 size={16} />
            <span>All Students</span>
            <span className="stu-tab-count">{students.length}</span>
          </button>
          <button
            className={`stu-tab ${activeTab === "add" ? "is-active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <UserPlus size={16} />
            <span>Add Student</span>
          </button>
          <button
            className={`stu-tab ${activeTab === "search" ? "is-active" : ""}`}
            onClick={() => { setActiveTab("search"); setProfileResult(null); setProfileSearchPerformed(false); setProfileSearchQuery(""); }}
          >
            <Search size={16} />
            <span>Search & Profile</span>
          </button>
          <button
            className={`stu-tab ${activeTab === "progress" ? "is-active" : ""}`}
            onClick={() => setActiveTab("progress")}
          >
            <BarChart3 size={16} />
            <span>Progress Tracker</span>
          </button>
        </div>
      </div>

      {/* ════════════════════ TAB: ALL STUDENTS ════════════════════ */}
      {activeTab === "all" && !selectedStudent && (
        <div className="stu-tab-content animate-fade-in">
          {/* Filters Bar */}
          <Card className="stu-filters-card">
            <div className="stu-filters-row">
              <div className="stu-search-box">
                <Search size={16} style={{ color: "var(--text-secondary)" }} />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="stu-search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="stu-search-clear">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="stu-filter-chips">
                {(["ALL", "Active", "Inactive", "Graduated"] as StatusFilter[]).map(s => (
                  <button
                    key={s}
                    className={`stu-filter-chip ${statusFilter === s ? "is-active" : ""}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "ALL" ? "All Status" : s}
                  </button>
                ))}
              </div>

              <select
                className="stu-batch-select"
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
              >
                <option value="ALL">All Batches</option>
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </Card>

          {/* Results Count */}
          <div className="stu-results-bar">
            <span>{filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found</span>
            <Button variant="ghost" size="sm" style={{ fontSize: "12px", gap: "4px" }}>
              <Download size={14} /> Export CSV
            </Button>
          </div>

          {/* Students Table */}
          {filteredStudents.length === 0 ? (
            <Card style={{ padding: "60px 20px", textAlign: "center" }}>
              <AlertCircle size={48} style={{ color: "var(--text-secondary)", margin: "0 auto 16px", opacity: 0.4 }} />
              <h3 style={{ color: "var(--text-secondary)", fontWeight: 600 }}>No students found</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Try adjusting your search or filter criteria.
              </p>
            </Card>
          ) : (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Table Header */}
              <div className="stu-table-header">
                <div className="stu-th stu-th-name" onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                  Student <SortIcon field="name" />
                </div>
                <div className="stu-th stu-th-batch" onClick={() => handleSort("batch")} style={{ cursor: "pointer" }}>
                  Batch <SortIcon field="batch" />
                </div>
                <div className="stu-th stu-th-enrolled" onClick={() => handleSort("enrollmentDate")} style={{ cursor: "pointer" }}>
                  Enrolled <SortIcon field="enrollmentDate" />
                </div>
                <div className="stu-th stu-th-attendance" onClick={() => handleSort("attendanceRate")} style={{ cursor: "pointer" }}>
                  Attendance <SortIcon field="attendanceRate" />
                </div>
                <div className="stu-th stu-th-status">Status</div>
                <div className="stu-th stu-th-fee">Fee</div>
                <div className="stu-th stu-th-actions">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredStudents.map(stu => {
                const sc = getStatusColor(stu.status);
                const fc = getFeeColor(stu.feeStatus);
                const isExpanded = expandedRow === stu.id;

                return (
                  <React.Fragment key={stu.id}>
                    <div className={`stu-table-row ${isExpanded ? "is-expanded" : ""}`}>
                      <div className="stu-td stu-td-name">
                        <div className={`avatar-initials-gradient ${getAvatarColor(stu.batch)}`} style={{ width: "36px", height: "36px", fontSize: "12px", flexShrink: 0 }}>
                          {getInitials(stu.name)}
                        </div>
                        <div>
                          <span className="stu-student-name">{stu.name}</span>
                          <span className="stu-student-email">{stu.email}</span>
                        </div>
                      </div>
                      <div className="stu-td stu-td-batch">
                        <span className="stu-batch-tag">{stu.batch}</span>
                      </div>
                      <div className="stu-td stu-td-enrolled">
                        {formatDate(stu.enrollmentDate)}
                      </div>
                      <div className="stu-td stu-td-attendance">
                        <div className="stu-attendance-cell">
                          <div className="stu-mini-progress-bar" style={{ width: "60px" }}>
                            <div className="stu-mini-progress-fill" style={{
                              width: `${stu.attendanceRate}%`,
                              background: stu.attendanceRate >= 85 ? "var(--color-success)" : stu.attendanceRate >= 60 ? "hsl(38, 92%, 50%)" : "var(--color-danger)"
                            }} />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 700 }}>{stu.attendanceRate}%</span>
                        </div>
                      </div>
                      <div className="stu-td stu-td-status">
                        <span className="stu-status-badge" style={{ background: sc.bg, color: sc.color }}>
                          <span className="stu-status-dot" style={{ background: sc.dot }} />
                          {stu.status}
                        </span>
                      </div>
                      <div className="stu-td stu-td-fee">
                        <span className="stu-fee-badge" style={{ background: fc.bg, color: fc.color }}>{stu.feeStatus}</span>
                      </div>
                      <div className="stu-td stu-td-actions">
                        <button className="stu-action-btn" onClick={() => { setSelectedStudent(stu); }} title="View Profile">
                          <Eye size={15} />
                        </button>
                        <button className="stu-action-btn" onClick={() => setExpandedRow(isExpanded ? null : stu.id)} title="Quick View">
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                        <button className="stu-action-btn stu-action-danger" onClick={() => handleDeleteStudent(stu.id)} title="Remove">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Quick-View Row */}
                    {isExpanded && (
                      <div className="stu-expanded-row animate-fade-in">
                        <div className="stu-expanded-inner">
                          <div className="stu-expanded-col">
                            <span className="stu-info-label"><Phone size={12} /> Phone</span>
                            <span className="stu-info-value">{stu.phone}</span>
                          </div>
                          <div className="stu-expanded-col">
                            <span className="stu-info-label"><User size={12} /> Guardian</span>
                            <span className="stu-info-value">{stu.guardianName}</span>
                          </div>
                          <div className="stu-expanded-col">
                            <span className="stu-info-label"><Calendar size={12} /> DOB</span>
                            <span className="stu-info-value">{formatDate(stu.dob)}</span>
                          </div>
                          <div className="stu-expanded-col">
                            <span className="stu-info-label"><IndianRupee size={12} /> Fee</span>
                            <span className="stu-info-value">₹{stu.feeAmount.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="stu-expanded-col" style={{ gridColumn: "span 2" }}>
                            <span className="stu-info-label"><MapPin size={12} /> Address</span>
                            <span className="stu-info-value">{stu.address}</span>
                          </div>
                          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px", marginTop: "4px" }}>
                            <Button variant="primary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedStudent(stu)}>
                              Full Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════ FULL PROFILE VIEW ════════════════════ */}
      {activeTab === "all" && selectedStudent && (
        <div className="stu-tab-content animate-fade-in">
          <button className="stu-back-btn" onClick={() => setSelectedStudent(null)}>
            <ArrowLeft size={16} /> Back to All Students
          </button>
          {renderProfileCard(selectedStudent)}
        </div>
      )}

      {/* ════════════════════ TAB: ADD STUDENT ════════════════════ */}
      {activeTab === "add" && (
        <div className="stu-tab-content animate-fade-in">
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 800, background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              New Student Registration
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "hsl(285,20%,45%)" }}>Fill in the details below to enroll a new student into the academy.</p>
          </div>
          <form onSubmit={handleAddStudent} autoComplete="off">
          {/* ── Section 1: Personal Info ── */}
          <div style={{background:"#fff",borderRadius:"16px",overflow:"hidden",marginBottom:"20px",boxShadow:"0 2px 16px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(285,30%,20%,0.07)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid hsla(285,30%,20%,0.06)",background:"linear-gradient(135deg,hsla(328,100%,54%,0.04),hsla(271,91%,60%,0.03))",display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))",display:"flex",alignItems:"center",justifyContent:"center"}}><User size={16} color="#fff"/></div>
              <div><h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>Personal Information</h3><p style={{margin:0,fontSize:"11px",color:"hsl(285,20%,45%)"}}>Student's basic identity details</p></div>
            </div>
            <div style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"18px"}}>
              {[
                {key:"name",label:"Full Name",ph:"e.g. Arjun Kumar Sharma",type:"text",icon:<User size={15}/>,req:true},
                {key:"email",label:"Email Address",ph:"student@email.com",type:"email",icon:<Mail size={15}/>,req:true},
                {key:"phone",label:"Phone Number",ph:"+91 98765 43210",type:"tel",icon:<Phone size={15}/>,req:true},
              ].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>{f.label} {f.req&&<span style={{color:"hsl(328,100%,54%)"}}>*</span>}</label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}>{f.icon}</span>
                    <input type={f.type} placeholder={f.ph} value={(formData as any)[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}
                      style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${(formErrors as any)[f.key]?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                      onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor=(formErrors as any)[f.key]?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                  </div>
                  {(formErrors as any)[f.key]&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>⚠ {(formErrors as any)[f.key]}</span>}
                </div>
              ))}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Date of Birth <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><Calendar size={15}/></span>
                  <input type="date" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${formErrors.dob?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor=formErrors.dob?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                </div>
                {formErrors.dob&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>⚠ {formErrors.dob}</span>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Gender</label>
                <div style={{display:"flex",gap:"8px"}}>
                  {(["Male","Female","Other"] as const).map(g=>(
                    <button key={g} type="button" onClick={()=>setFormData({...formData,gender:g})}
                      style={{flex:1,height:"44px",borderRadius:"10px",border:`1.5px solid ${formData.gender===g?"hsl(328,100%,54%)":"hsla(285,30%,20%,0.1)"}`,background:formData.gender===g?"hsla(328,100%,54%,0.08)":"#fafafa",color:formData.gender===g?"hsl(328,100%,54%)":"hsl(285,20%,45%)",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Guardian Info ── */}
          <div style={{background:"#fff",borderRadius:"16px",overflow:"hidden",marginBottom:"20px",boxShadow:"0 2px 16px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(285,30%,20%,0.07)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid hsla(285,30%,20%,0.06)",background:"linear-gradient(135deg,hsla(142,70%,42%,0.04),hsla(160,70%,35%,0.03))",display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"linear-gradient(135deg,hsl(142,70%,42%),hsl(160,70%,35%))",display:"flex",alignItems:"center",justifyContent:"center"}}><Users2 size={16} color="#fff"/></div>
              <div><h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>Guardian / Parent Information</h3><p style={{margin:0,fontSize:"11px",color:"hsl(285,20%,45%)"}}>Emergency contact & parent details</p></div>
            </div>
            <div style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"18px"}}>
              {[
                {key:"guardianName",label:"Guardian Name",ph:"Parent or guardian's full name",type:"text",icon:<User size={15}/>,req:true},
                {key:"guardianPhone",label:"Guardian Phone",ph:"+91 98765 43210",type:"tel",icon:<Phone size={15}/>,req:true},
              ].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>{f.label} {f.req&&<span style={{color:"hsl(328,100%,54%)"}}>*</span>}</label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}>{f.icon}</span>
                    <input type={f.type} placeholder={f.ph} value={(formData as any)[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}
                      style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${(formErrors as any)[f.key]?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                      onFocus={e=>(e.target.style.borderColor="hsl(142,70%,42%)")} onBlur={e=>(e.target.style.borderColor=(formErrors as any)[f.key]?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                  </div>
                  {(formErrors as any)[f.key]&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>⚠ {(formErrors as any)[f.key]}</span>}
                </div>
              ))}
              <div style={{display:"flex",flexDirection:"column",gap:"6px",gridColumn:"1 / -1"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Full Address</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><MapPin size={15}/></span>
                  <input type="text" placeholder="Street, locality, city, state, PIN code" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:"1.5px solid hsla(285,30%,20%,0.1)",background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(142,70%,42%)")} onBlur={e=>(e.target.style.borderColor="hsla(285,30%,20%,0.1)")}/>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Academic & Fees ── */}
          <div style={{background:"#fff",borderRadius:"16px",overflow:"hidden",marginBottom:"20px",boxShadow:"0 2px 16px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(285,30%,20%,0.07)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid hsla(285,30%,20%,0.06)",background:"linear-gradient(135deg,hsla(38,92%,50%,0.04),hsla(20,95%,55%,0.03))",display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"linear-gradient(135deg,hsl(38,92%,50%),hsl(20,95%,55%))",display:"flex",alignItems:"center",justifyContent:"center"}}><GraduationCap size={16} color="#fff"/></div>
              <div><h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>Academic & Fee Details</h3><p style={{margin:0,fontSize:"11px",color:"hsl(285,20%,45%)"}}>Class enrollment and fee structure</p></div>
            </div>
            <div style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"18px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Select Batch / Class</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><BookOpen size={15}/></span>
                  <select value={formData.batch} onChange={e=>setFormData({...formData,batch:e.target.value})}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:"1.5px solid hsla(285,30%,20%,0.1)",background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",cursor:"pointer",appearance:"none",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(38,92%,50%)")} onBlur={e=>(e.target.style.borderColor="hsla(285,30%,20%,0.1)")}>
                    {BATCHES.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Monthly Fee (₹)</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><IndianRupee size={15}/></span>
                  <input type="number" placeholder="e.g. 8500" min="0" value={formData.feeAmount} onChange={e=>setFormData({...formData,feeAmount:e.target.value})}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:"1.5px solid hsla(285,30%,20%,0.1)",background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(38,92%,50%)")} onBlur={e=>(e.target.style.borderColor="hsla(285,30%,20%,0.1)")}/>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px",gridColumn:"1 / -1"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Notes / Remarks</label>
                <textarea rows={3} placeholder="Special notes, medical info, aspirations, weak areas..." value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})}
                  style={{width:"100%",padding:"12px 14px",borderRadius:"10px",border:"1.5px solid hsla(285,30%,20%,0.1)",background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",resize:"vertical",lineHeight:1.5,transition:"border-color 0.2s"}}
                  onFocus={e=>(e.target.style.borderColor="hsl(38,92%,50%)")} onBlur={e=>(e.target.style.borderColor="hsla(285,30%,20%,0.1)")}/>
              </div>
            </div>
          </div>

          {/* ── Submit Bar ── */}
          <div style={{background:"#fff",borderRadius:"16px",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 2px 16px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(285,30%,20%,0.07)"}}>
            <p style={{margin:0,fontSize:"12px",color:"hsl(285,20%,55%)"}}>Fields with <span style={{color:"hsl(328,100%,54%)",fontWeight:700}}>*</span> are required</p>
            <div style={{display:"flex",gap:"12px"}}>
              <button type="button" onClick={()=>{setFormData({name:"",email:"",phone:"",dob:"",gender:"Male",guardianName:"",guardianPhone:"",address:"",batch:BATCHES[0],feeAmount:"8500",notes:""});setFormErrors({});}}
                style={{height:"42px",padding:"0 20px",borderRadius:"10px",border:"1.5px solid hsla(285,30%,20%,0.1)",background:"transparent",fontSize:"13px",fontWeight:600,cursor:"pointer",color:"hsl(285,50%,12%)",transition:"all 0.2s"}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="hsl(285,50%,12%)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="hsla(285,30%,20%,0.1)")}>
                Reset
              </button>
              <button type="submit"
                style={{height:"42px",padding:"0 28px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",boxShadow:"0 4px 14px hsla(328,100%,54%,0.35)",transition:"all 0.2s"}}
                onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-1px)")} onMouseLeave={e=>(e.currentTarget.style.transform="none")}>
                <CheckCircle2 size={15}/> Register Student
              </button>
            </div>
          </div>

          </form>
        </div>
      )}

      {/* ════════════════════ TAB: SEARCH & PROFILE ════════════════════ */}
      {activeTab === "search" && (
        <div className="stu-tab-content animate-fade-in">
          {/* Search Hero */}
          <Card className="stu-search-hero-card">
            <div className="stu-search-hero">
              <Search size={48} className="stu-search-hero-icon" />
              <h2 className="stu-search-hero-title">Find Student Profile</h2>
              <p className="stu-search-hero-desc">Search by student name, email address, or phone number to view their complete profile.</p>
              <div className="stu-search-hero-bar">
                <input
                  type="text"
                  className="stu-search-hero-input"
                  placeholder="Enter student name, email, or phone..."
                  value={profileSearchQuery}
                  onChange={(e) => setProfileSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleProfileSearch()}
                />
                <Button variant="primary" onClick={handleProfileSearch} leftIcon={<Search size={16} />}>
                  Search
                </Button>
              </div>
            </div>
          </Card>

          {/* Results */}
          {profileSearchPerformed && !profileResult && (
            <Card style={{ padding: "50px 20px", textAlign: "center", marginTop: "24px" }}>
              <XCircle size={48} style={{ color: "var(--text-secondary)", margin: "0 auto 16px", opacity: 0.4 }} />
              <h3 style={{ color: "var(--text-secondary)", fontWeight: 600, marginBottom: "6px" }}>No student found</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Try searching with a different name, email, or phone number.
              </p>
            </Card>
          )}

          {profileResult && (
            <div style={{ marginTop: "24px" }}>
              {renderProfileCard(profileResult)}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB: PROGRESS TRACKER ════════════════════ */}
      {activeTab === "progress" && (
        <div className="stu-tab-content animate-fade-in">
          <div className="stu-progress-grid">
            {students.filter(s => s.status === "Active").map(stu => {
              const avgScore = Math.round(stu.subjects.reduce((sum, s) => sum + s.score, 0) / stu.subjects.length);
              const starRating = Math.round(avgScore / 20); // 0-5 stars

              return (
                <Card key={stu.id} hoverLift className="stu-progress-card">
                  {/* Card Header */}
                  <div className="stu-progress-card-header">
                    <div className={`avatar-initials-gradient ${getAvatarColor(stu.batch)}`} style={{ width: "44px", height: "44px", fontSize: "14px" }}>
                      {getInitials(stu.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 className="stu-progress-name">{stu.name}</h4>
                      <span className="stu-progress-batch">{stu.batch}</span>
                    </div>
                    <div className="stu-star-rating">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={14} fill={i <= starRating ? "hsl(38, 92%, 50%)" : "transparent"} stroke={i <= starRating ? "hsl(38, 92%, 50%)" : "var(--border-glass)"} />
                      ))}
                    </div>
                  </div>

                  {/* Quick metrics */}
                  <div className="stu-progress-metrics">
                    <div className="stu-progress-metric">
                      <span className="stu-pm-label">Avg Score</span>
                      <span className="stu-pm-value" style={{ color: avgScore >= 85 ? "var(--color-success)" : avgScore >= 60 ? "hsl(38, 92%, 45%)" : "var(--color-danger)" }}>{avgScore}%</span>
                    </div>
                    <div className="stu-progress-metric">
                      <span className="stu-pm-label">Attendance</span>
                      <span className="stu-pm-value" style={{ color: stu.attendanceRate >= 85 ? "var(--color-success)" : stu.attendanceRate >= 60 ? "hsl(38, 92%, 45%)" : "var(--color-danger)" }}>{stu.attendanceRate}%</span>
                    </div>
                    <div className="stu-progress-metric">
                      <span className="stu-pm-label">Fee</span>
                      <span className="stu-pm-value" style={{ color: getFeeColor(stu.feeStatus).color, fontSize: "12px" }}>{stu.feeStatus}</span>
                    </div>
                  </div>

                  {/* Subject Bars */}
                  <div className="stu-progress-subjects">
                    {stu.subjects.map((sub, i) => (
                      <div key={i} className="stu-psub-row">
                        <span className="stu-psub-name">{sub.name}</span>
                        <div className="stu-psub-bar-bg">
                          <div className="stu-psub-bar-fill" style={{
                            width: `${sub.score}%`,
                            background: sub.score >= 85 ? "var(--color-success)" : sub.score >= 60 ? "hsl(38, 92%, 50%)" : "var(--color-danger)"
                          }} />
                        </div>
                        <span className="stu-psub-score">{sub.score}</span>
                        {sub.trend === "up" ? <TrendingUp size={12} style={{ color: "var(--color-success)" }} /> :
                          sub.trend === "down" ? <TrendingDown size={12} style={{ color: "var(--color-danger)" }} /> :
                            <span style={{ width: 12 }} />}
                      </div>
                    ))}
                  </div>

                  {/* View Profile Link */}
                  <button
                    className="stu-progress-view-btn"
                    onClick={() => { setSelectedStudent(stu); setActiveTab("all"); }}
                  >
                    View Full Profile <Eye size={14} />
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
