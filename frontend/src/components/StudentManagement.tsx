import React, { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { api } from "../utils/api";
import { addHistoryItem } from "../utils/history";
import { WhatsAppStatusWidget } from "./ui/WhatsAppStatusWidget";
import { StudentProfile } from "./StudentProfile";
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
  X,
  ExternalLink
} from "lucide-react";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Shadcn UI Styled Elements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BATCHES = [
  "5th Class", "6th Class", "7th Class", "8th Class",
  "9th Class", "10th Class", "11th Class", "12th Class"
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

const getAvatarColor = (_batch: string): string => "avatar-admin";

const formatDate = (d: string) => {
  if (!d) return "â€”";
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

interface StudentManagementProps {
  initialTab?: StudentTab;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const StudentManagement: React.FC<StudentManagementProps> = ({ initialTab = "all" }) => {
  // Core state â€” starts empty, loads from API
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);

  // Search & Profile state
  const [profileSearchQuery, setProfileSearchQuery] = useState("");
  const [profileResult, setProfileResult] = useState<Student | null>(null);
  const [profileSearchPerformed, setProfileSearchPerformed] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileView, setProfileView] = useState<"search" | "detail">("search");

  // Add Student form state
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", dob: "", gender: "Male" as "Male" | "Female" | "Other",
    guardianName: "", guardianPhone: "", address: "", batch: BATCHES[0],
    feeAmount: "8500", notes: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successModalData, setSuccessModalData] = useState<{ student: Student; whatsappLink: string } | null>(null);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const LS_STUDENTS_KEY = "ecrm_students_list";

  const getLocalStudents = (): Student[] => {
    try {
      const raw = localStorage.getItem(LS_STUDENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const saveLocalStudents = (list: Student[]) => {
    try { localStorage.setItem(LS_STUDENTS_KEY, JSON.stringify(list)); } catch (e) { console.error(e); }
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Load students from API & LocalStorage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      const localList = getLocalStudents();
      if (localList.length > 0) {
        setStudents(localList);
      }

      try {
        const res = await api.students.getAll();
        if (res.data && Array.isArray(res.data)) {
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

          const dbIds = new Set(mapped.map(s => s.id));
          const pendingLocal = localList.filter(s => s.id.startsWith("stu-") && !dbIds.has(s.id));
          const merged = [...pendingLocal, ...mapped];
          setStudents(merged);
          saveLocalStudents(merged);
        }
      } catch {
        // Backend offline â€” keep localList in state
      } finally {
        setIsLoadingStudents(false);
      }
    };
    loadStudents();
  }, []);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Filtered & Sorted Students â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === "Active").length,
    inactive: students.filter(s => s.status === "Inactive").length,
    graduated: students.filter(s => s.status === "Graduated").length,
    avgAttendance: Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length),
    feePending: students.filter(s => s.feeStatus !== "Paid").length,
    totalRevenue: students.filter(s => s.feeStatus === "Paid").reduce((sum, s) => sum + s.feeAmount, 0)
  }), [students]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Toggle Sort â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Delete Student â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDeleteStudent = async (id: string) => {
    // Optimistic UI update
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveLocalStudents(updated);
      return updated;
    });
    if (expandedRow === id) setExpandedRow(null);
    if (selectedStudent?.id === id) setSelectedStudent(null);
    try {
      await api.students.delete(id);
      showToast("Student record removed successfully.", "info");
    } catch {
      showToast("Student removed locally (DB sync pending).", "info");
    }
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Add Student â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if (Object.keys(errors).length > 0) {
      showToast("âš ï¸ Please fill in all required fields marked with *", "error");
    }
    return Object.keys(errors).length === 0;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const currentData = { ...formData };
    const nameParts = currentData.name.trim().split(" ");
    const optimisticStudent: Student = {
      id: `stu-${Date.now()}`,
      name: currentData.name, email: currentData.email, phone: currentData.phone,
      dob: currentData.dob, gender: currentData.gender,
      guardianName: currentData.guardianName, guardianPhone: currentData.guardianPhone,
      address: currentData.address, batch: currentData.batch,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "Active", feeAmount: parseInt(currentData.feeAmount) || 8500,
      feeStatus: "Pending", attendanceRate: 0, notes: currentData.notes,
      subjects: [
        { name: "Mathematics", score: 0, grade: "-", trend: "stable" },
        { name: "Science",     score: 0, grade: "-", trend: "stable" },
        { name: "English",     score: 0, grade: "-", trend: "stable" },
        { name: "Social Studies", score: 0, grade: "-", trend: "stable" },
      ],
    };

    // Optimistic UI â€” add immediately
    setStudents(prev => {
      const updated = [optimisticStudent, ...prev];
      saveLocalStudents(updated);
      return updated;
    });
    setFormData({ name: "", email: "", phone: "", dob: "", gender: "Male", guardianName: "", guardianPhone: "", address: "", batch: BATCHES[0], feeAmount: "8500", notes: "" });
    setFormErrors({});
    addHistoryItem({
      category: "Student",
      action: "Created",
      title: `Student registered: ${optimisticStudent.name}`,
      details: `Batch: ${optimisticStudent.batch} Â· Email: ${optimisticStudent.email} Â· Fee: â‚¹${optimisticStudent.feeAmount}`,
      badgeColor: "hsl(328,100%,54%)",
    });
    showToast(`ðŸŽ‰ ${optimisticStudent.name} registered successfully!`, "success");
    setActiveTab("all");

    // Default modal with WhatsApp invite link while DB request is processed
    const fallbackLink = `https://chat.whatsapp.com/ECRM_BATCH_${currentData.batch.replace(/\s+/g, "_").toUpperCase()}`;
    setSuccessModalData({
      student: optimisticStudent,
      whatsappLink: fallbackLink
    });

    // Save to database in background
    try {
      const res = await api.students.create({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || nameParts[0],
        email: currentData.email,
        phone: currentData.phone,
        parentName: currentData.guardianName,
        parentPhone: currentData.guardianPhone,
        parentEmail: currentData.email,
        dateOfBirth: currentData.dob,
        batch: currentData.batch,
        feeAmount: currentData.feeAmount
      });
      if (res && res.data) {
        const s = res.data;
        const mappedStudent: Student = {
          id: s.id,
          name: s.user ? `${s.user.firstName} ${s.user.lastName}` : (s.parentName || "Student"),
          email: s.user?.email || s.parentEmail,
          phone: s.user?.phone || s.parentPhone,
          dob: s.dateOfBirth?.split("T")[0] || "",
          gender: currentData.gender,
          guardianName: s.parentName,
          guardianPhone: s.parentPhone,
          address: currentData.address,
          batch: s.enrollments?.[0]?.batch?.name || currentData.batch,
          enrollmentDate: s.createdAt?.split("T")[0] || "",
          status: "Active" as const,
          feeAmount: s.invoices?.[0]?.totalAmount || 0,
          feeStatus: (s.invoices?.[0]?.status === "PAID" ? "Paid" : s.invoices?.[0]?.status === "PARTIAL" ? "Pending" : "Overdue") as any,
          attendanceRate: 0,
          notes: currentData.notes,
          subjects: optimisticStudent.subjects,
        };
        setStudents(prev => {
          const updated = prev.map(item => item.id === optimisticStudent.id ? mappedStudent : item);
          saveLocalStudents(updated);
          return updated;
        });
        
        // Update modal data with server-assigned student ID and backend link
        const wlink = res.whatsappLink || fallbackLink;
        setSuccessModalData({
          student: mappedStudent,
          whatsappLink: wlink
        });
      }
    } catch (err) {
      console.error("Database save failed, student retained in local storage:", err);
    }
  };

  // ——————————— Profile Search — Live Suggestions + API Fetch ———————————
  const handleProfileSearchInput = (val: string) => {
    setProfileSearchQuery(val);
    if (!val.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = val.toLowerCase().trim();
    // Case-insensitive match on name, email, phone, batch — show ALL matches
    const matches = students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.batch.toLowerCase().includes(q)
    );
    setSearchSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const handleSelectStudentProfile = async (stu: Student) => {
    setShowSuggestions(false);
    setProfileSearchQuery(stu.name);
    setIsLoadingProfile(true);
    setProfileView("detail");
    // Show local data immediately for instant render
    setProfileResult(stu);

    // Fetch fresh data from backend
    if (!stu.id.startsWith("stu-")) {
      try {
        const res = await api.students.getOne(stu.id);
        if (res.data) {
          const s = res.data;
          const attendanceRecords: any[] = s.attendance || [];
          const presentCount = attendanceRecords.filter((a: any) => a.status === "PRESENT").length;
          const attendanceRate = attendanceRecords.length > 0
            ? Math.round((presentCount / attendanceRecords.length) * 100)
            : stu.attendanceRate;

          const enriched: Student = {
            id: s.id,
            name: s.user ? `${s.user.firstName} ${s.user.lastName}` : (s.parentName || stu.name),
            email: s.user?.email || s.parentEmail || stu.email,
            phone: s.user?.phone || s.parentPhone || stu.phone,
            dob: s.dateOfBirth?.split("T")[0] || stu.dob,
            gender: stu.gender,
            guardianName: s.parentName || stu.guardianName,
            guardianPhone: s.parentPhone || stu.guardianPhone,
            address: stu.address,
            batch: s.enrollments?.[0]?.batch?.name || stu.batch,
            enrollmentDate: s.createdAt?.split("T")[0] || stu.enrollmentDate,
            status: stu.status,
            feeAmount: s.invoices?.[0]?.totalAmount || stu.feeAmount,
            feeStatus: (s.invoices?.[0]?.status === "PAID" ? "Paid" : s.invoices?.[0]?.status === "PARTIAL" ? "Pending" : "Overdue") as any,
            attendanceRate,
            notes: stu.notes,
            subjects: stu.subjects,
          };
          setProfileResult(enriched);
        }
      } catch {
        // keep local data already shown
      }
    }
    setIsLoadingProfile(false);
    setProfileSearchPerformed(true);
  };

  const handleProfileSearch = () => {
    const q = profileSearchQuery.toLowerCase().trim();
    if (!q) return;
    // Find ALL students matching the query (case-insensitive, any field)
    const matches = students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.batch.toLowerCase().includes(q)
    );
    if (matches.length === 1) {
      // Exactly one result — open profile modal directly
      handleSelectStudentProfile(matches[0]);
    } else if (matches.length > 1) {
      // Multiple results — show all in dropdown so admin can pick the right one
      setSearchSuggestions(matches);
      setShowSuggestions(true);
      setProfileSearchPerformed(false);
    } else {
      // No results
      setProfileSearchPerformed(true);
      setProfileResult(null);
      setShowSuggestions(false);
      setProfileView("search");
    }
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Render Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              <span className="stu-info-label">Fee (â‚¹{student.feeAmount.toLocaleString("en-IN")})</span>
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MAIN RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            onClick={() => { setActiveTab("search"); setProfileResult(null); setProfileSearchPerformed(false); setProfileSearchQuery(""); setProfileView("search"); setSearchSuggestions([]); setShowSuggestions(false); }}
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB: ALL STUDENTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                            <span className="stu-info-value">â‚¹{stu.feeAmount.toLocaleString("en-IN")}</span>
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FULL PROFILE VIEW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "all" && selectedStudent && (
        <div className="stu-tab-content animate-fade-in">
          <button className="stu-back-btn" onClick={() => setSelectedStudent(null)}>
            <ArrowLeft size={16} /> Back to All Students
          </button>
          {renderProfileCard(selectedStudent)}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB: ADD STUDENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "add" && (
        <div className="stu-tab-content animate-fade-in">
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 800, background: "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              New Student Registration
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "hsl(285,20%,45%)" }}>Fill in the details below to enroll a new student into the academy.</p>
          </div>
          <form onSubmit={handleAddStudent} autoComplete="off">
          {/* â”€â”€ Section 1: Personal Info â”€â”€ */}
          <div style={{background:"#fff",borderRadius:"16px",overflow:"hidden",marginBottom:"20px",boxShadow:"0 2px 16px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(285,30%,20%,0.07)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid hsla(285,30%,20%,0.06)",background:"linear-gradient(135deg,hsla(328,100%,54%,0.04),hsla(271,91%,60%,0.03))",display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))",display:"flex",alignItems:"center",justifyContent:"center"}}><User size={16} color="#fff"/></div>
              <div><h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>Personal Information</h3><p style={{margin:0,fontSize:"11px",color:"hsl(285,20%,45%)"}}>Student's basic identity details</p></div>
            </div>
            <div style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"18px"}}>
              {/* Full Name â€” letters and spaces only */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Full Name <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><User size={15}/></span>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Kumar Sharma"
                    value={formData.name}
                    maxLength={60}
                    onChange={e => {
                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                      setFormData({...formData, name: val});
                    }}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${formErrors.name?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor=formErrors.name?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                </div>
                {formErrors.name&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>âš  {formErrors.name}</span>}
              </div>

              {/* Email */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Email Address <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><Mail size={15}/></span>
                  <input
                    type="email"
                    placeholder="student@email.com"
                    value={formData.email}
                    maxLength={100}
                    onChange={e => setFormData({...formData, email: e.target.value.replace(/\s/g, "")})}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${formErrors.email?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor=formErrors.email?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                </div>
                {formErrors.email&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>âš  {formErrors.email}</span>}
              </div>

              {/* Phone â€” exactly 10 digits, numbers only */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Phone Number <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><Phone size={15}/></span>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    maxLength={10}
                    inputMode="numeric"
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData({...formData, phone: val});
                    }}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${formErrors.phone?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s",letterSpacing:"0.05em"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor=formErrors.phone?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                  <span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"11px",color:"hsl(285,20%,60%)",pointerEvents:"none"}}>{formData.phone.length}/10</span>
                </div>
                {formErrors.phone&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>âš  {formErrors.phone}</span>}
              </div>
              {/* Date of Birth â€” must be between 3 and 30 years ago */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Date of Birth <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><Calendar size={15}/></span>
                  <input
                    type="date"
                    value={formData.dob}
                    min={`${new Date().getFullYear()-30}-01-01`}
                    max={`${new Date().getFullYear()-3}-12-31`}
                    onChange={e=>setFormData({...formData,dob:e.target.value})}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${formErrors.dob?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor=formErrors.dob?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                </div>
                {formErrors.dob&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>âš  {formErrors.dob}</span>}
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

          {/* â”€â”€ Section 2: Guardian Info â”€â”€ */}
          <div style={{background:"#fff",borderRadius:"16px",overflow:"hidden",marginBottom:"20px",boxShadow:"0 2px 16px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(285,30%,20%,0.07)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid hsla(285,30%,20%,0.06)",background:"linear-gradient(135deg,hsla(142,70%,42%,0.04),hsla(160,70%,35%,0.03))",display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"linear-gradient(135deg,hsl(142,70%,42%),hsl(160,70%,35%))",display:"flex",alignItems:"center",justifyContent:"center"}}><Users2 size={16} color="#fff"/></div>
              <div><h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>Guardian / Parent Information</h3><p style={{margin:0,fontSize:"11px",color:"hsl(285,20%,45%)"}}>Emergency contact & parent details</p></div>
            </div>
            <div style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"18px"}}>
              {/* Guardian Name â€” letters and spaces only */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Guardian Name <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><User size={15}/></span>
                  <input
                    type="text"
                    placeholder="Parent or guardian's full name"
                    value={formData.guardianName}
                    maxLength={60}
                    onChange={e => {
                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                      setFormData({...formData, guardianName: val});
                    }}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${(formErrors as any).guardianName?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(142,70%,42%)")} onBlur={e=>(e.target.style.borderColor=(formErrors as any).guardianName?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                </div>
                {(formErrors as any).guardianName&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>âš  {(formErrors as any).guardianName}</span>}
              </div>

              {/* Guardian Phone â€” exactly 10 digits */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Guardian Phone <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><Phone size={15}/></span>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.guardianPhone}
                    maxLength={10}
                    inputMode="numeric"
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData({...formData, guardianPhone: val});
                    }}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:`1.5px solid ${(formErrors as any).guardianPhone?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)"}`,background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s",letterSpacing:"0.05em"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(142,70%,42%)")} onBlur={e=>(e.target.style.borderColor=(formErrors as any).guardianPhone?"hsl(342,90%,48%)":"hsla(285,30%,20%,0.1)")}/>
                  <span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"11px",color:"hsl(285,20%,60%)",pointerEvents:"none"}}>{formData.guardianPhone.length}/10</span>
                </div>
                {(formErrors as any).guardianPhone&&<span style={{fontSize:"11px",color:"hsl(342,90%,48%)"}}>âš  {(formErrors as any).guardianPhone}</span>}
              </div>

              {/* Full Address â€” free text, capped at 200 chars */}
              <div style={{display:"flex",flexDirection:"column",gap:"6px",gridColumn:"1 / -1"}}>
                <label style={{fontSize:"11px",fontWeight:700,color:"hsl(285,20%,45%)",textTransform:"uppercase",letterSpacing:"0.5px"}}>Full Address</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"hsl(285,20%,55%)",display:"flex",pointerEvents:"none"}}><MapPin size={15}/></span>
                  <input
                    type="text"
                    placeholder="Street, locality, city, state, PIN code"
                    value={formData.address}
                    maxLength={200}
                    onChange={e=>setFormData({...formData,address:e.target.value})}
                    style={{width:"100%",height:"44px",padding:"0 14px 0 38px",borderRadius:"10px",border:"1.5px solid hsla(285,30%,20%,0.1)",background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",transition:"border-color 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(142,70%,42%)")} onBlur={e=>(e.target.style.borderColor="hsla(285,30%,20%,0.1)")}/>
                </div>
              </div>
            </div>
          </div>

          {/* â”€â”€ Section 3: Academic & Fees (Redesigned) â”€â”€ */}
          <div style={{background:"#fff",borderRadius:"20px",overflow:"hidden",marginBottom:"24px",boxShadow:"0 4px 20px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(38,92%,50%,0.18)"}}>
            <div style={{padding:"20px 28px",borderBottom:"1px solid hsla(38,92%,50%,0.12)",background:"linear-gradient(135deg,hsla(38,92%,50%,0.08),hsla(20,95%,55%,0.05))",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"12px",background:"linear-gradient(135deg,hsl(38,92%,50%),hsl(20,95%,55%))",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px hsla(38,92%,50%,0.25)"}}>
                  <GraduationCap size={18} color="#fff"/>
                </div>
                <div>
                  <h3 style={{margin:0,fontSize:"15px",fontWeight:800,color:"hsl(285,50%,12%)"}}>Academic & Fee Enrollment</h3>
                  <p style={{margin:0,fontSize:"12px",color:"hsl(285,20%,45%)"}}>Assign student to a batch and set class fee structure</p>
                </div>
              </div>
              <span style={{fontSize:"11px",fontWeight:800,color:"hsl(38,92%,42%)",background:"hsla(38,92%,50%,0.12)",padding:"4px 12px",borderRadius:"20px",border:"1px solid hsla(38,92%,50%,0.25)"}}>
                Auto-Onboarding Active
              </span>
            </div>

            <div style={{padding:"28px",display:"flex",flexDirection:"column",gap:"22px"}}>
              {/* Top Row: Batch & Fee Inputs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:"20px"}}>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  <label style={{fontSize:"12px",fontWeight:700,color:"hsl(285,50%,15%)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span>SELECT BATCH / CLASS <span style={{color:"hsl(328,100%,54%)"}}>*</span></span>
                    <span style={{fontSize:"11px",color:"var(--color-success)",fontWeight:600}}>ðŸŸ¢ Active Roster</span>
                  </label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",color:"hsl(38,92%,50%)",display:"flex",pointerEvents:"none"}}><BookOpen size={17}/></span>
                    <select value={formData.batch} onChange={e=>setFormData({...formData,batch:e.target.value})}
                      style={{width:"100%",height:"48px",padding:"0 16px 0 42px",borderRadius:"12px",border:"1.5px solid hsla(38,92%,50%,0.25)",background:"#fff",fontSize:"14px",fontWeight:600,outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.03)",transition:"all 0.2s"}}
                      onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor="hsla(38,92%,50%,0.25)")}>
                      {BATCHES.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  <label style={{fontSize:"12px",fontWeight:700,color:"hsl(285,50%,15%)"}}>MONTHLY FEE STRUCTURE (â‚¹) <span style={{color:"hsl(328,100%,54%)"}}>*</span></label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",color:"hsl(142,70%,42%)",display:"flex",pointerEvents:"none"}}><IndianRupee size={17}/></span>
                  <input
                    type="number"
                    placeholder="e.g. 8500"
                    min="100"
                    max="100000"
                    step="50"
                    value={formData.feeAmount}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      const num = parseInt(val, 10);
                      if (val === "" || (num >= 0 && num <= 100000)) {
                        setFormData({...formData, feeAmount: val});
                      }
                    }}
                    onKeyDown={e => {
                      if (["e","E","+","-","."].includes(e.key)) e.preventDefault();
                    }}
                    style={{width:"100%",height:"48px",padding:"0 16px 0 42px",borderRadius:"12px",border:"1.5px solid hsla(142,70%,42%,0.25)",background:"#fff",fontSize:"14px",fontWeight:700,outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",boxShadow:"0 2px 8px rgba(0,0,0,0.03)",transition:"all 0.2s"}}
                    onFocus={e=>(e.target.style.borderColor="hsl(142,70%,42%)")} onBlur={e=>(e.target.style.borderColor="hsla(142,70%,42%,0.25)")}/>
                  </div>
                </div>
              </div>

              {/* Live WhatsApp Connection Status */}
              <WhatsAppStatusWidget />

              {/* Remarks */}
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                <label style={{fontSize:"12px",fontWeight:700,color:"hsl(285,50%,15%)"}}>ADDITIONAL NOTES & REMARKS</label>
                <textarea rows={3} placeholder="Add special instructions, learning goals, or medical remarks..." value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})}
                  style={{width:"100%",padding:"14px 16px",borderRadius:"12px",border:"1.5px solid hsla(285,30%,20%,0.12)",background:"#fafafa",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"hsl(285,50%,12%)",resize:"vertical",lineHeight:1.5,transition:"all 0.2s"}}
                  onFocus={e=>(e.target.style.borderColor="hsl(328,100%,54%)")} onBlur={e=>(e.target.style.borderColor="hsla(285,30%,20%,0.12)")}/>
              </div>
            </div>
          </div>

          {/* â”€â”€ Action Submit Bar (Redesigned) â”€â”€ */}
          <div style={{background:"#fff",borderRadius:"20px",padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 20px -4px rgba(29,10,39,0.08)",border:"1px solid hsla(285,30%,20%,0.08)"}}>
            <p style={{margin:0,fontSize:"13px",color:"hsl(285,20%,45%)",display:"flex",alignItems:"center",gap:"6px"}}>
              <AlertCircle size={15} style={{color:"hsl(328,100%,54%)"}}/> Fields with <span style={{color:"hsl(328,100%,54%)",fontWeight:800}}>*</span> are mandatory
            </p>
            <div style={{display:"flex",gap:"14px"}}>
              <button type="button" onClick={()=>{setFormData({name:"",email:"",phone:"",dob:"",gender:"Male",guardianName:"",guardianPhone:"",address:"",batch:BATCHES[0],feeAmount:"8500",notes:""});setFormErrors({});}}
                style={{height:"46px",padding:"0 24px",borderRadius:"12px",border:"1.5px solid hsla(285,30%,20%,0.15)",background:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",color:"hsl(285,50%,15%)",transition:"all 0.2s"}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="hsl(285,50%,12%)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="hsla(285,30%,20%,0.15)")}>
                Reset Form
              </button>
              <button type="submit"
                style={{height:"46px",padding:"0 32px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))",color:"#fff",fontSize:"14px",fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:"10px",boxShadow:"0 6px 20px -2px hsla(328,100%,54%,0.4)",transition:"all 0.2s"}}
                onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-2px)")} onMouseLeave={e=>(e.currentTarget.style.transform="none")}>
                <CheckCircle2 size={17}/> Enroll Student Now
              </button>
            </div>
          </div>

          </form>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB: SEARCH & PROFILE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "search" && (
        <div className="stu-tab-content animate-fade-in">

          {/* â”€â”€ SEARCH VIEW â”€â”€ */}
          {profileView === "search" && (
            <>
              {/* Hero Banner */}
              <div style={{
                background: "linear-gradient(135deg, hsl(271,91%,55%) 0%, hsl(328,100%,50%) 100%)",
                borderRadius: "24px", padding: "48px 36px", textAlign: "center",
                marginBottom: "28px", position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-80px", left: "-40px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: "68px", height: "68px", borderRadius: "22px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                    <Search size={32} color="#fff" />
                  </div>
                  <h2 style={{ margin: "0 0 10px", fontSize: "30px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>Find a Student Profile</h2>
                  <p style={{ margin: "0 0 32px", fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
                    Search by name, email, phone, or batch â€” get the complete student profile with real-time data
                  </p>

                  {/* Live Search Input */}
                  <div style={{ position: "relative", maxWidth: "580px", margin: "0 auto" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "hsl(285,20%,55%)", pointerEvents: "none", zIndex: 1 }} />
                        <input
                          type="text"
                          placeholder="Type student name, email, phone or batch..."
                          value={profileSearchQuery}
                          onChange={(e) => handleProfileSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleProfileSearch();
                            if (e.key === "Escape") setShowSuggestions(false);
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                          onFocus={() => profileSearchQuery.trim() && setShowSuggestions(searchSuggestions.length > 0)}
                          style={{
                            width: "100%", height: "54px", padding: "0 16px 0 48px",
                            borderRadius: "16px", border: "none", background: "#fff",
                            fontSize: "14px", outline: "none", boxSizing: "border-box",
                            color: "hsl(285,50%,12%)", fontFamily: "inherit",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.18)", position: "relative"
                          }}
                        />
                        {/* Live Suggestions Dropdown */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                          <div style={{
                            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                            background: "#fff", borderRadius: "18px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
                            zIndex: 9999, overflow: "hidden",
                            border: "1px solid hsla(285,30%,20%,0.08)"
                          }}>
                            <div style={{ padding: "10px 16px 6px", fontSize: "10px", fontWeight: 800, color: "hsl(285,20%,55%)", textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: "1px solid hsla(285,30%,20%,0.06)" }}>
                              {searchSuggestions.length} result{searchSuggestions.length !== 1 ? "s" : ""} found
                            </div>
                            {searchSuggestions.map((s) => {
                              const sc = getStatusColor(s.status);
                              return (
                                <div
                                  key={s.id}
                                  onMouseDown={() => handleSelectStudentProfile(s)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "11px 16px", cursor: "pointer",
                                    transition: "background 0.15s", borderBottom: "1px solid hsla(285,30%,20%,0.04)"
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "hsla(271,91%,60%,0.05)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                  <div className="avatar-initials-gradient avatar-admin" style={{ width: "38px", height: "38px", fontSize: "12px", flexShrink: 0 }}>
                                    {getInitials(s.name)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(285,50%,12%)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                                    <div style={{ fontSize: "11px", color: "hsl(285,20%,55%)", display: "flex", gap: "8px" }}>
                                      <span>{s.email}</span>
                                      <span>Â·</span>
                                      <span>{s.batch}</span>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px", background: sc.bg, color: sc.color, flexShrink: 0 }}>{s.status}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleProfileSearch}
                        style={{
                          height: "54px", padding: "0 28px", borderRadius: "16px",
                          border: "1.5px solid rgba(255,255,255,0.35)",
                          background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: "14px",
                          fontWeight: 800, cursor: "pointer", backdropFilter: "blur(10px)",
                          display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, transition: "all 0.2s"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                      >
                        <Search size={16} /> Search
                      </button>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "28px" }}>
                    {[{ label: "Total Students", val: students.length }, { label: "Active", val: stats.active }, { label: "Batches", val: BATCHES.length }].map(item => (
                      <div key={item.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff" }}>{item.val}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* No Result Message */}
              {profileSearchPerformed && !profileResult && (
                <div style={{ background: "#fff", borderRadius: "20px", padding: "56px 24px", textAlign: "center", boxShadow: "0 4px 20px -4px rgba(29,10,39,0.08)", marginBottom: "28px" }}>
                  <XCircle size={52} style={{ color: "hsl(342,90%,60%)", margin: "0 auto 16px", opacity: 0.6 }} />
                  <h3 style={{ color: "hsl(285,50%,12%)", fontWeight: 700, marginBottom: "8px" }}>No student found</h3>
                  <p style={{ fontSize: "13px", color: "hsl(285,20%,55%)", maxWidth: "340px", margin: "0 auto" }}>
                    No match for <strong>"{profileSearchQuery}"</strong>. Try a different name, email, phone or batch.
                  </p>
                </div>
              )}

              {/* Recently Enrolled Quick-Select */}
              {students.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "13px", fontWeight: 800, color: "hsl(285,50%,12%)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    <Users2 size={15} style={{ color: "var(--color-accent)" }} /> Recently Enrolled
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "12px" }}>
                    {students.slice(0, 6).map(s => {
                      const sc = getStatusColor(s.status);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStudentProfile(s)}
                          style={{
                            background: "#fff", borderRadius: "16px", padding: "16px",
                            boxShadow: "0 2px 12px -2px rgba(29,10,39,0.08)",
                            border: "1px solid hsla(285,30%,20%,0.07)",
                            cursor: "pointer", transition: "all 0.2s", display: "flex", gap: "14px", alignItems: "center"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(29,10,39,0.14)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px -2px rgba(29,10,39,0.08)"; }}
                        >
                          <div className="avatar-initials-gradient avatar-admin" style={{ width: "44px", height: "44px", fontSize: "14px", flexShrink: 0 }}>
                            {getInitials(s.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "hsl(285,50%,12%)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                            <div style={{ fontSize: "12px", color: "hsl(285,20%,55%)", marginTop: "2px" }}>{s.batch} Â· {s.email}</div>
                          </div>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px", background: sc.bg, color: sc.color, flexShrink: 0 }}>{s.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â• STUDENT PROFILE MODAL â•â•â•â•â•â•â•â• */}
      {profileResult && (
        <div
          onClick={() => { setProfileResult(null); setProfileView("search"); }}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(10, 4, 20, 0.72)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9998, padding: "20px"
          }}
        >
          {/* Modal Card â€” stop click from bubbling to backdrop */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "640px",
              maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
              border: "1px solid hsla(285,30%,20%,0.1)", position: "relative"
            }}
          >
            {/* â”€â”€ Loading spinner inside modal â”€â”€ */}
            {isLoadingProfile && (
              <div style={{ position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "rgba(255,255,255,0.9)", borderRadius: "20px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 700, color: "hsl(285,50%,12%)", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                <div style={{ width: "14px", height: "14px", border: "2px solid hsla(328,100%,54%,0.3)", borderTopColor: "hsl(328,100%,54%)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Refreshing from serverâ€¦
              </div>
            )}

            {/* â”€â”€ Header Banner â”€â”€ */}
            <div style={{
              background: "linear-gradient(135deg, hsl(271,91%,42%) 0%, hsl(328,100%,46%) 100%)",
              padding: "32px 28px 76px", position: "relative", overflow: "hidden", borderRadius: "24px 24px 0 0"
            }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-70px", left: "20%", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
              {/* X Close Button */}
              <button
                onClick={() => { setProfileResult(null); setProfileView("search"); }}
                style={{
                  position: "absolute", top: "16px", right: "16px",
                  background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
                  width: "34px", height: "34px", borderRadius: "50%", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", zIndex: 5, transition: "background 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.32)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
              >
                <X size={16} />
              </button>
              {/* Status badge */}
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "20px" }}>
                <span style={{ background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.28)", letterSpacing: "0.3px" }}>
                  â— {profileResult.status}
                </span>
              </div>
              {/* Avatar + Name */}
              <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "22px",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.1))",
                  border: "3px solid rgba(255,255,255,0.4)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "28px", fontWeight: 900, color: "#fff",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.2)", flexShrink: 0,
                  backdropFilter: "blur(8px)", userSelect: "none"
                }}>
                  {getInitials(profileResult.name)}
                </div>
                <div>
                  <h2 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.5px" }}>{profileResult.name}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.88)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <GraduationCap size={12} /> {profileResult.batch}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Â·</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>Enrolled {formatDate(profileResult.enrollmentDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* â”€â”€ 3 Key Stats (overlapping banner) â”€â”€ */}
            <div style={{ margin: "-32px 24px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", position: "relative", zIndex: 2 }}>
              {[
                { icon: <Activity size={15} style={{ color: "var(--color-info)" }} />, label: "Attendance", val: `${profileResult.attendanceRate}%`, color: profileResult.attendanceRate >= 85 ? "var(--color-success)" : profileResult.attendanceRate >= 60 ? "hsl(38,92%,45%)" : "var(--color-danger)" },
                { icon: <IndianRupee size={15} style={{ color: "hsl(38,92%,45%)" }} />, label: "Fee Amount", val: `â‚¹${profileResult.feeAmount.toLocaleString("en-IN")}`, color: "hsl(285,50%,12%)" },
                { icon: <CheckCircle2 size={15} style={{ color: getFeeColor(profileResult.feeStatus).color }} />, label: "Fee Status", val: profileResult.feeStatus, color: getFeeColor(profileResult.feeStatus).color },
              ].map((item, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: "14px", padding: "14px",
                  boxShadow: "0 4px 16px -4px rgba(29,10,39,0.14)",
                  border: "1px solid hsla(285,30%,20%,0.07)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    {item.icon}
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "hsl(285,20%,55%)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: "18px", fontWeight: 900, color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* â”€â”€ Body â”€â”€ */}
            <div style={{ padding: "24px" }}>

              {/* Attendance Progress Bar */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "hsl(285,20%,45%)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Attendance Rate</span>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: profileResult.attendanceRate >= 85 ? "var(--color-success)" : profileResult.attendanceRate >= 60 ? "hsl(38,92%,45%)" : "var(--color-danger)" }}>{profileResult.attendanceRate}%</span>
                </div>
                <div style={{ height: "9px", background: "hsla(285,30%,20%,0.08)", borderRadius: "9px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "9px", transition: "width 1s ease",
                    width: `${profileResult.attendanceRate}%`,
                    background: profileResult.attendanceRate >= 85 ? "linear-gradient(90deg,var(--color-success),hsl(142,70%,55%))" : profileResult.attendanceRate >= 60 ? "linear-gradient(90deg,hsl(38,92%,45%),hsl(38,92%,60%))" : "linear-gradient(90deg,var(--color-danger),hsl(342,90%,60%))"
                  }} />
                </div>
              </div>

              {/* Info Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "24px" }}>
                {[
                  { icon: <Mail size={13} />, label: "Email", val: profileResult.email || "â€”" },
                  { icon: <Phone size={13} />, label: "Phone", val: profileResult.phone || "â€”" },
                  { icon: <Calendar size={13} />, label: "Date of Birth", val: formatDate(profileResult.dob) },
                  { icon: <User size={13} />, label: "Gender", val: profileResult.gender },
                  { icon: <Users2 size={13} />, label: "Guardian", val: profileResult.guardianName || "â€”" },
                  { icon: <Phone size={13} />, label: "Guardian Phone", val: profileResult.guardianPhone || "â€”" },
                  { icon: <GraduationCap size={13} />, label: "Batch", val: profileResult.batch },
                  { icon: <MapPin size={13} />, label: "Address", val: profileResult.address || "â€”" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", gap: "10px", alignItems: "flex-start",
                    background: "hsl(285,30%,98.5%)", borderRadius: "12px",
                    padding: "12px 14px", border: "1px solid hsla(285,30%,20%,0.06)"
                  }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "hsla(271,91%,60%,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(271,91%,50%)", flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "9px", fontWeight: 800, color: "hsl(285,20%,55%)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "3px" }}>{item.label}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "hsl(285,50%,12%)", wordBreak: "break-word" }}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subject Performance */}
              {profileResult.subjects.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 800, color: "hsl(285,50%,12%)", display: "flex", alignItems: "center", gap: "7px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    <BookOpen size={13} style={{ color: "var(--color-accent)" }} /> Subject Performance
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {profileResult.subjects.map((sub, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "hsl(285,50%,12%)", width: "120px", flexShrink: 0 }}>{sub.name}</span>
                        <div style={{ flex: 1, height: "7px", background: "hsla(285,30%,20%,0.08)", borderRadius: "7px", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: "7px", width: `${sub.score}%`, background: sub.score >= 85 ? "linear-gradient(90deg,var(--color-success),hsl(142,70%,55%))" : sub.score >= 60 ? "linear-gradient(90deg,hsl(38,92%,45%),hsl(38,92%,60%))" : "linear-gradient(90deg,var(--color-danger),hsl(342,90%,60%))" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 800, width: "34px", textAlign: "right", color: "hsl(285,50%,12%)" }}>{sub.score}%</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, background: "hsla(285,30%,20%,0.06)", padding: "2px 7px", borderRadius: "6px", color: "hsl(285,20%,45%)", minWidth: "24px", textAlign: "center" }}>{sub.grade}</span>
                        {sub.trend === "up" ? <TrendingUp size={13} style={{ color: "var(--color-success)", flexShrink: 0 }} /> : sub.trend === "down" ? <TrendingDown size={13} style={{ color: "var(--color-danger)", flexShrink: 0 }} /> : <span style={{ width: "13px", flexShrink: 0 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {profileResult.notes && (
                <div style={{ background: "hsla(38,92%,50%,0.06)", borderRadius: "12px", padding: "16px", border: "1px solid hsla(38,92%,50%,0.18)", marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 800, color: "hsl(38,92%,38%)", display: "flex", alignItems: "center", gap: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    <FileText size={12} /> Notes & Remarks
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "hsl(285,50%,12%)", lineHeight: 1.6 }}>{profileResult.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", paddingTop: "20px", borderTop: "1px solid hsla(285,30%,20%,0.07)" }}>
                <button
                  onClick={() => { setSelectedStudent(profileResult); setActiveTab("all"); setProfileResult(null); }}
                  style={{
                    flex: 1, height: "44px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, hsl(271,91%,60%), hsl(328,100%,54%))",
                    color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: "0 6px 18px -2px hsla(328,100%,54%,0.35)", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "none")}
                >
                  <Eye size={15} /> Open Full Profile
                </button>
                <button
                  onClick={() => { setProfileResult(null); setProfileView("search"); }}
                  style={{
                    height: "44px", padding: "0 20px", borderRadius: "12px",
                    border: "1.5px solid hsla(285,30%,20%,0.14)", background: "#fff",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "hsl(285,50%,12%)", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "hsl(285,50%,12%)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.14)")}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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
                    onClick={() => { setProfileStudentId(stu.id); }}
                  >
                    View Full Profile <Eye size={14} />
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€ REGISTRATION SUCCESS MODAL (WhatsApp Link + Credentials) â”€â”€ */}
      {successModalData && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 7, 26, 0.75)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px"
        }}>
          <div className="animate-scale-up" style={{
            background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "520px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)", overflow: "hidden", border: "1px solid hsla(142,70%,45%,0.25)"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, hsl(142,70%,40%), hsl(160,70%,35%))",
              padding: "28px 32px", color: "#fff", textAlign: "center", position: "relative"
            }}>
              <button onClick={() => setSuccessModalData(null)} style={{
                position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.2)",
                border: "none", width: "32px", height: "32px", borderRadius: "50%", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}>
                <X size={18} />
              </button>
              <div style={{ width: "54px", height: "54px", borderRadius: "18px", background: "#fff", color: "hsl(142,70%,40%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800 }}>Student Enrolled Successfully!</h2>
              <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Onboarding credentials & batch invite details generated</p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Student Summary */}
              <div style={{ background: "#f9fafb", borderRadius: "14px", padding: "16px", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Enrolled Student:</span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>{successModalData.student.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Assigned Batch:</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.1)", padding: "2px 10px", borderRadius: "12px" }}>{successModalData.student.batch}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Login Email:</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{successModalData.student.email}</span>
                </div>
              </div>

              {/* WhatsApp Action Box */}
              <div style={{ background: "linear-gradient(135deg, #f0fdf4, #e8f5e9)", borderRadius: "16px", padding: "20px", border: "1.5px solid #25d366" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#25d366", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={16} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#166534" }}>Batch WhatsApp Group Invite</h4>
                </div>
                <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#15803d", lineHeight: 1.4 }}>
                  Share this WhatsApp invite link with the student or parent to join their official class discussion group:
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" readOnly value={successModalData.whatsappLink}
                    style={{ flex: 1, height: "40px", padding: "0 12px", borderRadius: "10px", border: "1px solid #bbf7d0", background: "#fff", fontSize: "12px", fontFamily: "monospace", color: "#166534" }} />
                  <button onClick={() => {
                    navigator.clipboard.writeText(successModalData.whatsappLink);
                    showToast("ðŸ“‹ WhatsApp link copied to clipboard!", "success");
                  }} style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: "10px", padding: "0 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    Copy
                  </button>
                  <a href={successModalData.whatsappLink} target="_blank" rel="noreferrer" style={{ background: "#25d366", color: "#fff", textDecoration: "none", borderRadius: "10px", padding: "0 16px", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                    Open WhatsApp <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Email & Mobile App Notification Status */}
              <div style={{ background: "#eff6ff", borderRadius: "14px", padding: "16px", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "12px" }}>
                <Mail size={20} style={{ color: "#2563eb", flexShrink: 0 }} />
                <div style={{ fontSize: "12px", color: "#1e40af", lineHeight: 1.4 }}>
                  <strong>Onboarding Email Sent!</strong> Contains credentials (Password: <code>Student@123</code>), timetable, WhatsApp link, and Mobile App download link.
                </div>
              </div>

              <Button variant="primary" style={{ width: "100%", height: "46px", borderRadius: "12px", fontSize: "14px", fontWeight: 800 }} onClick={() => setSuccessModalData(null)}>
                Done & Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Overlay */}
      {profileStudentId && (
        <StudentProfile studentId={profileStudentId} onClose={() => setProfileStudentId(null)} />
      )}
    </div>
  );
};
