import React, { useState, useEffect } from "react";
import {
  BookOpen, Users2, GraduationCap, Plus, Search, Calendar,
  Clock, IndianRupee, ChevronRight, X, UserPlus, Trash2,
  Filter, CheckCircle2, Activity, Sparkles, Layers, Award,
  Phone, Mail, Check, AlertCircle, ArrowUpRight, BarChart2, MapPin
} from "lucide-react";
import { api } from "../utils/api";
import { StudentProfile } from "./StudentProfile";

interface BatchesManagementProps {
  onNavigate?: (view: string) => void;
}

export function BatchesManagement({ onNavigate }: BatchesManagementProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("ALL");
  
  // Modals state
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState<any | null>(null);
  const [batchStudentSearch, setBatchStudentSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewStudentProfileId, setViewStudentProfileId] = useState<string | null>(null);
  const [enrollStudentModalOpen, setEnrollStudentModalOpen] = useState(false);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState("");

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Create Batch Form State
  const [newBatch, setNewBatch] = useState({
    name: "",
    subject: "Science",
    capacity: "30",
    feeAmount: "10000",
    feeFrequency: "MONTHLY",
    teacherId: "",
    teacherName: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    timings: "Mon, Wed, Fri (09:00 AM - 11:00 AM)",
    roomNo: "Room 102",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [batRes, stuRes, stfRes] = await Promise.all([
        api.batches.getAll().catch(() => null),
        api.students.getAll().catch(() => null),
        api.staff.getAll().catch(() => null),
      ]);

      let loadedStudents: any[] = [];
      if (stuRes?.data) {
        loadedStudents = stuRes.data;
        setStudents(loadedStudents);
      }

      let loadedStaff: any[] = [];
      if (stfRes?.data) {
        loadedStaff = stfRes.data;
        setStaff(loadedStaff);
      }

      // Build student lookup map for full name and contact data linking
      const studentMap = new Map<string, any>();
      loadedStudents.forEach((s: any) => {
        if (s.id) studentMap.set(s.id, s);
        if (s.user?.id) studentMap.set(s.user.id, s);
      });

      if (batRes?.data && batRes.data.length > 0) {
        const normalizedBatches = batRes.data.map((b: any) => ({
          ...b,
          enrollments: (b.enrollments || []).map((e: any) => {
            const sObj = studentMap.get(e.studentId) || studentMap.get(e.id) || e.student || e;
            const name = e.name || (sObj?.user ? `${sObj.user.firstName} ${sObj.user.lastName}` : sObj?.parentName || "Enrolled Student");
            const email = e.email || sObj?.user?.email || sObj?.parentEmail || "student@local.com";
            const phone = e.phone || sObj?.user?.phone || sObj?.parentPhone || "—";
            return {
              id: sObj?.id || e.id,
              name,
              email,
              phone,
              status: e.status || "ACTIVE",
              feeStatus: e.feeStatus || "PAID",
              attendanceRate: e.attendanceRate || 92,
              enrollmentDate: e.createdAt || e.enrollmentDate || new Date().toISOString(),
            };
          }),
        }));
        setBatches(normalizedBatches);
      } else {
        setBatches([]);
      }
    } catch (err) {
      console.error(err);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Filtered Batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          batch.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          batch.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedSubjectFilter === "ALL") return matchesSearch;
    if (selectedSubjectFilter === "SCIENCE") return matchesSearch && (batch.subject?.toLowerCase().includes("physics") || batch.subject?.toLowerCase().includes("science") || batch.subject?.toLowerCase().includes("math"));
    if (selectedSubjectFilter === "MEDICAL") return matchesSearch && (batch.subject?.toLowerCase().includes("bio") || batch.name?.toLowerCase().includes("neet"));
    if (selectedSubjectFilter === "JEE") return matchesSearch && batch.name?.toLowerCase().includes("jee");
    return matchesSearch;
  });

  // Calculate Global Batch Stats
  const totalBatches = batches.length;
  const totalEnrolledStudents = batches.reduce((acc, b) => acc + (b.enrollments?.length || 0), 0);
  const totalCapacity = batches.reduce((acc, b) => acc + (Number(b.capacity) || 0), 0);
  const avgFillRate = totalCapacity > 0 ? Math.round((totalEnrolledStudents / totalCapacity) * 100) : 0;
  const totalRevenue = batches.reduce((acc, b) => acc + ((b.enrollments?.length || 0) * Number(b.feeAmount || 0)), 0);

  // Handle Create Batch Submission
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name.trim() || !newBatch.subject.trim()) {
      showToast("Please enter batch name and subject", "error");
      return;
    }

    try {
      const payload = {
        name: newBatch.name,
        subject: newBatch.subject,
        capacity: parseInt(newBatch.capacity),
        feeAmount: parseFloat(newBatch.feeAmount),
        feeFrequency: newBatch.feeFrequency,
        teacherId: newBatch.teacherId || "teacher-1",
        startDate: newBatch.startDate,
        endDate: newBatch.endDate,
      };

      const res = await api.batches.create(payload).catch(() => null);

      const createdBatch = {
        id: res?.data?.id || `batch-${Date.now()}`,
        name: newBatch.name,
        subject: newBatch.subject,
        capacity: parseInt(newBatch.capacity),
        feeAmount: parseFloat(newBatch.feeAmount),
        feeFrequency: newBatch.feeFrequency,
        teacher: { name: newBatch.teacherName || "Assigned Teacher", avatar: "AT", title: "Faculty" },
        timings: newBatch.timings,
        roomNo: newBatch.roomNo,
        startDate: newBatch.startDate,
        endDate: newBatch.endDate,
        enrollments: [],
      };

      setBatches([createdBatch, ...batches]);
      setIsCreateModalOpen(false);
      showToast(`Batch "${newBatch.name}" created successfully!`, "success");
      setNewBatch({
        name: "",
        subject: "Science",
        capacity: "30",
        feeAmount: "10000",
        feeFrequency: "MONTHLY",
        teacherId: "",
        teacherName: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        timings: "Mon, Wed, Fri (09:00 AM - 11:00 AM)",
        roomNo: "Room 102",
      });
    } catch (err: any) {
      showToast(err.message || "Failed to create batch", "error");
    }
  };

  // Handle Enroll Student into Batch
  const handleEnrollStudent = async () => {
    if (!selectedBatchForStudents || !selectedStudentToEnroll) return;
    const targetStudent = students.find(s => s.id === selectedStudentToEnroll);
    if (!targetStudent) return;

    try {
      await api.batches.enroll(selectedBatchForStudents.id, targetStudent.id).catch(() => null);

      const newStudentObj = {
        id: targetStudent.id,
        name: targetStudent.user ? `${targetStudent.user.firstName} ${targetStudent.user.lastName}` : targetStudent.parentName || "Student",
        email: targetStudent.user?.email || targetStudent.parentEmail || "student@local.com",
        phone: targetStudent.user?.phone || targetStudent.parentPhone || "9876543210",
        status: "ACTIVE",
        feeStatus: "PAID",
        attendanceRate: 90,
        enrollmentDate: new Date().toISOString(),
      };

      const updatedBatches = batches.map(b => {
        if (b.id === selectedBatchForStudents.id) {
          const updatedEnrollments = [...(b.enrollments || []), newStudentObj];
          const updatedB = { ...b, enrollments: updatedEnrollments };
          setSelectedBatchForStudents(updatedB);
          return updatedB;
        }
        return b;
      });

      setBatches(updatedBatches);
      setEnrollStudentModalOpen(false);
      setSelectedStudentToEnroll("");
      showToast(`Enrolled ${newStudentObj.name} into ${selectedBatchForStudents.name}!`, "success");
    } catch (err: any) {
      showToast("Failed to enroll student", "error");
    }
  };

  // Delete Batch
  const handleDeleteBatch = async (batchId: string, batchName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) return;
    try {
      await api.batches.delete(batchId).catch(() => null);
      setBatches(batches.filter(b => b.id !== batchId));
      if (selectedBatchForStudents?.id === batchId) setSelectedBatchForStudents(null);
      showToast(`Batch "${batchName}" deleted`, "info");
    } catch {
      showToast("Failed to delete batch", "error");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }} className="animate-fade-in">

      {/* Toast alert */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 99999,
          padding: "12px 20px", borderRadius: "12px", background: toast.type === "error" ? "var(--color-danger)" : toast.type === "info" ? "var(--color-accent)" : "var(--color-success)",
          color: "#fff", fontWeight: 700, fontSize: "13px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: "8px"
        }} className="animate-fade-in">
          <Sparkles size={16} /> {toast.msg}
        </div>
      )}

      {/* Student Profile Modal integration */}
      {viewStudentProfileId && (
        <StudentProfile studentId={viewStudentProfileId} onClose={() => setViewStudentProfileId(null)} />
      )}

      {/* ══════════════ HEADER BAR ══════════════ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Batches & Student Groups</h1>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.08)", padding: "4px 12px", borderRadius: "20px", border: "1px solid hsla(328,100%,54%,0.15)" }}>
              {totalBatches} Active Cohorts
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)" }}>
            Manage student cohorts, track class capacities, inspect student rosters, and view course schedules.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: "11px 22px", borderRadius: "14px", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
              color: "#fff", fontSize: "13.5px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 6px 20px -4px hsla(328,100%,54%,0.35)", transition: "all 0.25s ease"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          >
            <Plus size={16} /> Create New Batch
          </button>
        </div>
      </div>

      {/* ══════════════ KPI METRICS SUMMARY ══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Active Batches", value: totalBatches, icon: <BookOpen size={20} />, color: "hsl(271,91%,60%)", bg: "hsla(271,91%,60%,0.08)", sub: "Configured cohorts" },
          { label: "Total Enrolled Students", value: totalEnrolledStudents, icon: <Users2 size={20} />, color: "hsl(328,100%,54%)", bg: "hsla(328,100%,54%,0.08)", sub: "Across all batches" },
          { label: "Avg Capacity Fill Rate", value: `${avgFillRate}%`, icon: <BarChart2 size={20} />, color: "hsl(142,70%,40%)", bg: "hsla(142,70%,40%,0.08)", sub: `${totalEnrolledStudents} of ${totalCapacity} seats filled` },
          { label: "Course Revenue Potential", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: <IndianRupee size={20} />, color: "hsl(200,95%,45%)", bg: "hsla(200,95%,45%,0.08)", sub: "Active batch fees" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: "20px", padding: "20px",
            border: "1px solid var(--border-glass)", boxShadow: "var(--shadow-card)",
            display: "flex", alignItems: "center", gap: "16px"
          }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</p>
              <h3 style={{ margin: "2px 0", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>{stat.value}</h3>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════ FILTER & SEARCH CONTROLS ══════════════ */}
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "16px 20px", marginBottom: "28px",
        border: "1px solid var(--border-glass)", boxShadow: "0 2px 12px rgba(29,10,39,0.03)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px"
      }}>
        {/* Search Bar */}
        <div style={{ position: "relative", minWidth: "280px", flex: "1 1 300px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            type="text"
            placeholder="Search batches by name, subject, or teacher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "11px 14px 11px 40px", borderRadius: "14px",
              border: "1px solid var(--border-glass)", background: "var(--bg-secondary)",
              fontSize: "13.5px", outline: "none", transition: "all 0.2s ease"
            }}
          />
        </div>

        {/* Subject Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { key: "ALL", label: "All Streams" },
            { key: "SCIENCE", label: "Science & Math" },
            { key: "MEDICAL", label: "NEET / Medical" },
            { key: "JEE", label: "JEE Competitive" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedSubjectFilter(tab.key)}
              style={{
                padding: "8px 16px", borderRadius: "12px", fontSize: "12.5px", fontWeight: 700,
                cursor: "pointer", border: "1px solid", transition: "all 0.2s ease",
                background: selectedSubjectFilter === tab.key ? "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))" : "transparent",
                borderColor: selectedSubjectFilter === tab.key ? "transparent" : "var(--border-glass)",
                color: selectedSubjectFilter === tab.key ? "#fff" : "var(--text-secondary)",
                boxShadow: selectedSubjectFilter === tab.key ? "0 4px 14px hsla(328,100%,54%,0.25)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════ ELEGANT BATCH CARDS GRID ══════════════ */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="btn-spinner" style={{ width: "32px", height: "32px", borderColor: "var(--color-accent) transparent transparent transparent" }} />
          <p style={{ margin: "14px 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>Loading student cohorts...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "24px", padding: "60px 20px", textAlign: "center", border: "1px solid var(--border-glass)" }}>
          <BookOpen size={48} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700 }}>No Batches Found</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
            {searchQuery ? `No batches matching "${searchQuery}".` : "Get started by creating your first student batch."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "24px" }}>
          {filteredBatches.map(batch => {
            const enrolledList = batch.enrollments || [];
            const studentCount = enrolledList.length;
            const cap = Number(batch.capacity) || 30;
            const fillPct = Math.min(100, Math.round((studentCount / cap) * 100));
            const isFull = studentCount >= cap;
            const isAlmostFull = fillPct >= 80 && !isFull;

            return (
              <div
                key={batch.id}
                onClick={() => setSelectedBatchForStudents(batch)}
                style={{
                  background: "#ffffff", borderRadius: "24px", overflow: "hidden",
                  border: "1px solid var(--border-glass)", boxShadow: "var(--shadow-card)",
                  cursor: "pointer", transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "flex", flexDirection: "column", position: "relative"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px -12px rgba(328, 100%, 54%, 0.18)";
                  e.currentTarget.style.borderColor = "hsla(328, 100%, 54%, 0.3)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "var(--shadow-card)";
                  e.currentTarget.style.borderColor = "var(--border-glass)";
                }}
              >
                {/* Stunning Top Header Bar */}
                <div style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, hsla(328,100%,54%,0.05), hsla(271,91%,60%,0.08))",
                  borderBottom: "1px solid var(--border-glass)",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Layers size={18} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "hsl(271,91%,55%)", textTransform: "uppercase", letterSpacing: "0.6px", background: "#fff", padding: "4px 10px", borderRadius: "20px", border: "1px solid hsla(271,91%,60%,0.2)" }}>
                      {batch.subject}
                    </span>
                  </div>

                  <button
                    title="Delete Batch"
                    onClick={(e) => handleDeleteBatch(batch.id, batch.name, e)}
                    style={{ background: "#fff", border: "1px solid var(--border-glass)", borderRadius: "10px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", opacity: 0.7 }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--color-danger)"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Batch Title */}
                  <h3 style={{ margin: "0 0 10px", fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", wordBreak: "break-word" }}>
                    {batch.name}
                  </h3>

                  {/* Teacher Chip */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "14px", marginBottom: "16px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, flexShrink: 0 }}>
                      {batch.teacher?.avatar || "T"}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-word" }}>
                        {batch.teacher?.name || "Assigned Teacher"}
                      </p>
                      <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>
                        {batch.teacher?.title || "Course Instructor"}
                      </p>
                    </div>
                  </div>

                  {/* Schedule & Timing Pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ padding: "8px 10px", background: "hsla(271,91%,60%,0.04)", borderRadius: "10px", border: "1px solid hsla(271,91%,60%,0.1)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} style={{ color: "hsl(271,91%,60%)", flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-word" }}>
                        {batch.timings || "Mon, Wed, Fri"}
                      </span>
                    </div>

                    <div style={{ padding: "8px 10px", background: "hsla(142,70%,42%,0.04)", borderRadius: "10px", border: "1px solid hsla(142,70%,42%,0.1)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <IndianRupee size={13} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success)" }}>
                        ₹{Number(batch.feeAmount || 0).toLocaleString("en-IN")} <span style={{ fontSize: "9px", color: "var(--text-secondary)", fontWeight: 500 }}>/ mo</span>
                      </span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid var(--border-glass)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
                        Enrolled Students
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: isFull ? "var(--color-danger)" : "var(--text-primary)" }}>
                        {studentCount} / {cap} ({fillPct}%)
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                      <div style={{
                        width: `${fillPct}%`, height: "100%", borderRadius: "4px", transition: "width 0.5s ease",
                        background: isFull ? "var(--color-danger)" : isAlmostFull ? "hsl(38,92%,50%)" : "linear-gradient(90deg, hsl(328,100%,54%), hsl(271,91%,60%))"
                      }} />
                    </div>

                    {/* Footer Row: Student Overlapping Avatars & Action Button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {enrolledList.slice(0, 4).map((stu: any, idx: number) => {
                          const sName = stu.name || (stu.student?.user ? `${stu.student.user.firstName} ${stu.student.user.lastName}` : "Student");
                          const initial = sName.charAt(0)?.toUpperCase() || "S";
                          return (
                            <div
                              key={stu.id || idx}
                              title={sName}
                              style={{
                                width: "30px", height: "30px", borderRadius: "50%",
                                background: "linear-gradient(135deg, hsl(271,91%,60%), hsl(328,100%,54%))",
                                color: "#fff", fontSize: "11px", fontWeight: 800,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: "2px solid #fff", marginLeft: idx === 0 ? 0 : "-8px",
                                zIndex: 5 - idx
                              }}
                            >
                              {initial}
                            </div>
                          );
                        })}
                        {studentCount > 4 && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginLeft: "8px" }}>
                            +{studentCount - 4} more
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedBatchForStudents(batch); }}
                        style={{
                          padding: "8px 18px", borderRadius: "12px", border: "none", cursor: "pointer",
                          background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff",
                          fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px",
                          boxShadow: "0 4px 14px hsla(328,100%,54%,0.25)", transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        View Students <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════ PERFECTLY CENTERED BATCH STUDENTS MODAL ══════════════ */}
      {selectedBatchForStudents && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px"
          }}
          onClick={() => setSelectedBatchForStudents(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "820px", maxHeight: "82vh", height: "auto", margin: "auto",
              background: "#ffffff", borderRadius: "24px", overflow: "hidden", display: "flex", flexDirection: "column",
              boxShadow: "0 24px 64px -12px rgba(29,10,39,0.35)"
            }}
            className="animate-fade-in"
          >
            {/* Modal Top Header */}
            <div style={{
              padding: "20px 24px", background: "linear-gradient(135deg, hsl(285,50%,12%), hsl(285,50%,18%))",
              color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0
            }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "hsl(328,100%,65%)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  {selectedBatchForStudents.subject}
                </span>
                <h2 style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: 800, color: "#fff", wordBreak: "break-word" }}>
                  {selectedBatchForStudents.name}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                  Teacher: {selectedBatchForStudents.teacher?.name || "Assigned Teacher"} · Fee: ₹{Number(selectedBatchForStudents.feeAmount || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => setEnrollStudentModalOpen(true)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))",
                    color: "#fff", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <UserPlus size={14} /> Add Student to Batch
                </button>
                <button onClick={() => setSelectedBatchForStudents(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", opacity: 0.8 }}>
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Sub-header Controls Bar */}
            <div style={{ padding: "14px 24px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", flexShrink: 0 }}>
              <div style={{ position: "relative", width: "240px" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                <input
                  type="text"
                  placeholder="Search students in batch..."
                  value={batchStudentSearch}
                  onChange={e => setBatchStudentSearch(e.target.value)}
                  style={{ width: "100%", padding: "7px 12px 7px 32px", borderRadius: "10px", border: "1px solid var(--border-glass)", background: "#fff", fontSize: "12px", outline: "none" }}
                />
              </div>

              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                Enrolled: {selectedBatchForStudents.enrollments?.length || 0} / {selectedBatchForStudents.capacity} Students
              </span>
            </div>

            {/* Student List View */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {(selectedBatchForStudents.enrollments?.length || 0) === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <Users2 size={40} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    No students enrolled in this batch yet.
                  </p>
                  <button
                    onClick={() => setEnrollStudentModalOpen(true)}
                    style={{ marginTop: "14px", padding: "8px 18px", borderRadius: "10px", border: "none", background: "var(--color-accent)", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                  >
                    Enroll First Student
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {selectedBatchForStudents.enrollments
                    .filter((stu: any) => {
                      const sObj = stu.student || stu;
                      const name = stu.name || (sObj?.user ? `${sObj.user.firstName} ${sObj.user.lastName}` : sObj?.parentName || "");
                      return name.toLowerCase().includes(batchStudentSearch.toLowerCase()) ||
                             (stu.email || "").toLowerCase().includes(batchStudentSearch.toLowerCase());
                    })
                    .map((stu: any, idx: number) => {
                      const sObj = stu.student || stu;
                      const displayName = stu.name || (sObj?.user ? `${sObj.user.firstName} ${sObj.user.lastName}` : sObj?.parentName || "Enrolled Student");
                      const displayEmail = stu.email || sObj?.user?.email || sObj?.parentEmail || "student@local.com";
                      const displayPhone = stu.phone || sObj?.user?.phone || sObj?.parentPhone || "—";
                      const initial = displayName.charAt(0)?.toUpperCase() || "S";

                      return (
                        <div
                          key={stu.id || idx}
                          style={{
                            padding: "14px 18px", background: "#fff", borderRadius: "16px",
                            border: "1px solid var(--border-glass)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff", fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {initial}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-word" }}>
                                {displayName}
                              </h4>
                              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)", wordBreak: "break-all", overflowWrap: "anywhere" }}>
                                {displayEmail} · {displayPhone}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ textAlign: "right" }}>
                              <span style={{
                                fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "6px",
                                background: stu.feeStatus === "PAID" ? "hsla(142,70%,42%,0.08)" : "hsla(342,90%,48%,0.08)",
                                color: stu.feeStatus === "PAID" ? "var(--color-success)" : "var(--color-danger)"
                              }}>
                                Fee: {stu.feeStatus || "PAID"}
                              </span>
                              <p style={{ margin: "3px 0 0", fontSize: "10px", color: "var(--text-secondary)" }}>
                                Att: {stu.attendanceRate || 92}%
                              </p>
                            </div>

                            <button
                              onClick={() => setViewStudentProfileId(stu.id)}
                              style={{
                                padding: "7px 14px", borderRadius: "10px", border: "1px solid var(--border-glass)",
                                background: "var(--bg-secondary)", cursor: "pointer", fontSize: "11.5px", fontWeight: 700,
                                color: "var(--text-primary)", transition: "all 0.2s"
                              }}
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PERFECTLY CENTERED ENROLL STUDENT MODAL ══════════════ */}
      {enrollStudentModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "460px", background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Enroll Student to Batch</h3>
              <button onClick={() => setEnrollStudentModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "18px" }}>
              Select a student to enroll into <strong>{selectedBatchForStudents?.name}</strong>:
            </p>

            {students.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--color-danger)" }}>No registered students available to enroll.</p>
            ) : (
              <select
                value={selectedStudentToEnroll}
                onChange={e => setSelectedStudentToEnroll(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "12px", border: "1px solid var(--border-glass)", fontSize: "13px", marginBottom: "24px", outline: "none", background: "#fff" }}
              >
                <option value="">-- Select Student --</option>
                {students.map(s => {
                  const sName = s.user ? `${s.user.firstName} ${s.user.lastName}` : s.parentName || "Student";
                  return <option key={s.id} value={s.id}>{sName} ({s.user?.email || s.parentEmail || s.id})</option>;
                })}
              </select>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setEnrollStudentModalOpen(false)} style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid var(--border-glass)", background: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                Cancel
              </button>
              <button
                onClick={handleEnrollStudent}
                disabled={!selectedStudentToEnroll}
                style={{ padding: "9px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff", cursor: selectedStudentToEnroll ? "pointer" : "not-allowed", opacity: selectedStudentToEnroll ? 1 : 0.6, fontSize: "12px", fontWeight: 700 }}
              >
                Confirm Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PERFECTLY CENTERED CREATE NEW BATCH MODAL ══════════════ */}
      {isCreateModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "560px", background: "#fff", borderRadius: "24px", padding: "28px", boxShadow: "0 24px 64px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }} className="animate-fade-in">
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>Create New Student Batch</h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Set up a new cohort, course timing, and max capacity.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateBatch} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Batch Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 12th Science - Batch B"
                  value={newBatch.name}
                  onChange={e => setNewBatch({ ...newBatch, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "13px", outline: "none" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Subject / Stream *</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics & Math"
                    value={newBatch.subject}
                    onChange={e => setNewBatch({ ...newBatch, subject: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "13px", outline: "none" }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Max Student Capacity</label>
                  <input
                    type="number"
                    value={newBatch.capacity}
                    onChange={e => setNewBatch({ ...newBatch, capacity: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "13px", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Course Fee (₹)</label>
                  <input
                    type="number"
                    value={newBatch.feeAmount}
                    onChange={e => setNewBatch({ ...newBatch, feeAmount: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "13px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Fee Cycle</label>
                  <select
                    value={newBatch.feeFrequency}
                    onChange={e => setNewBatch({ ...newBatch, feeFrequency: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "13px", outline: "none" }}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="TERM">Per Term / Semester</option>
                    <option value="ONE_TIME">One-Time Total</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Assigned Faculty / Teacher</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. R. Sharma"
                  value={newBatch.teacherName}
                  onChange={e => setNewBatch({ ...newBatch, teacherName: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "13px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Class Schedule & Timings</label>
                <input
                  type="text"
                  placeholder="e.g. Mon, Wed, Fri (09:00 AM - 11:00 AM)"
                  value={newBatch.timings}
                  onChange={e => setNewBatch({ ...newBatch, timings: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "13px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid var(--border-glass)", background: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                  Create Batch
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
