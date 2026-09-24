import { useState, useEffect } from "react";
import { api } from "../utils/api";
import {
  Users2, ChevronLeft, Search, Layers, Mail, Phone,
} from "lucide-react";
import { ACCENT, ACCENT_DARK, LABEL, VALUE, CARD_SHADOW, FONT } from "../utils/theme";
import { Spinner } from "./ui/Spinner";
import { StudentProfileTabs, ProfileHeader } from "./ui/StudentProfileView";

type Level = "batches" | "students" | "profile";

interface Batch { id: string; name: string; subject?: string; feeAmount?: number; }
interface Student {
  id: string;
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  parentName?: string; parentPhone?: string; parentEmail?: string;
  motherName?: string; motherPhone?: string;
  gender?: string; address?: string; dateOfBirth?: string;
  bloodGroup?: string; schoolName?: string; currentClass?: string;
  city?: string; state?: string; pinCode?: string;
  enrollments?: { batch?: Batch }[];
  invoices?: any[];
  createdAt?: string;
}

export function StudentProfiles({ userRole = "STUDENT" }: { userRole?: string } = {}) {
  // Admin/teacher/staff only. Routing already blocks students, but guard here too.
  void userRole;
  const [level, setLevel] = useState<Level>("batches");

  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [batchSearch, setBatchSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Load all batches + students once
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [bRes, sRes] = await Promise.all([api.batches.getAll(), api.students.getAll()]);
        setBatches(bRes.data || []);
        setStudents(sRes.data || []);
      } catch {
        setBatches([]);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Count students per batch
  const studentsInBatch = (batchId: string) =>
    students.filter((s) => s.enrollments?.some((e) => e.batch?.id === batchId));

  // "Unassigned" students (no batch)
  const unassignedStudents = students.filter((s) => !s.enrollments || s.enrollments.length === 0);

  const openBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setStudentSearch("");
    setLevel("students");
  };

  const openStudent = async (student: Student) => {
    setSelectedStudent(student);
    setLevel("profile");
    setProfileLoading(true);
    try {
      const res = await api.students.getProfile(student.id);
      setProfile(res.data || student);
    } catch {
      setProfile(student);
    } finally {
      setProfileLoading(false);
    }
  };

  const fullName = (s?: Student | null) =>
    `${s?.user?.firstName || ""} ${s?.user?.lastName || ""}`.trim() || "Unnamed Student";

  const initials = (s?: Student | null) => {
    const f = s?.user?.firstName?.[0] || "";
    const l = s?.user?.lastName?.[0] || "";
    return (f + l).toUpperCase() || "S";
  };

  // ── LEVEL 1: BATCHES ──────────────────────────────────
  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(batchSearch.toLowerCase())
  );

  const renderBatches = () => (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 4px" }}>
          Student Profiles
        </h2>
        <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>
          Select a batch to view its students.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "360px", marginBottom: "22px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: VALUE }} />
        <input
          value={batchSearch}
          onChange={(e) => setBatchSearch(e.target.value)}
          placeholder="Search batches..."
          style={{
            width: "100%", padding: "10px 12px 10px 38px", borderRadius: "4px",
            border: "1px solid #dee2e6", fontSize: "14px", background: "#fff", outline: "none",
          }}
        />
      </div>

      {isLoading ? (
        <Spinner label="Loading batches..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {filteredBatches.map((batch) => {
            const count = studentsInBatch(batch.id).length;
            return (
              <button
                key={batch.id}
                onClick={() => openBatch(batch)}
                style={{
                  textAlign: "left", background: "#fff", borderRadius: "10px", padding: "20px",
                  border: "1px solid #eef0f4", boxShadow: CARD_SHADOW, cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease", display: "flex",
                  flexDirection: "column", gap: "14px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px",
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                  }}>
                    <Layers size={22} />
                  </div>
                  <span style={{
                    background: "#eef0fe", color: ACCENT, fontSize: "12px", fontWeight: 700,
                    padding: "4px 12px", borderRadius: "8px",
                  }}>
                    {count} {count === 1 ? "student" : "students"}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#3a3f45" }}>{batch.name}</div>
                  <div style={{ fontSize: "12px", color: VALUE, marginTop: "2px" }}>
                    {batch.subject || "General"}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Unassigned students bucket */}
          {unassignedStudents.length > 0 && (
            <button
              onClick={() => openBatch({ id: "__unassigned__", name: "Unassigned Students" })}
              style={{
                textAlign: "left", background: "#fff", borderRadius: "10px", padding: "20px",
                border: "1px dashed #c8cdd6", boxShadow: CARD_SHADOW, cursor: "pointer",
                display: "flex", flexDirection: "column", gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "10px", background: "#eef0f4",
                  display: "flex", alignItems: "center", justifyContent: "center", color: VALUE,
                }}>
                  <Users2 size={22} />
                </div>
                <span style={{ background: "#eef0f4", color: VALUE, fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "8px" }}>
                  {unassignedStudents.length}
                </span>
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#3a3f45" }}>Unassigned Students</div>
                <div style={{ fontSize: "12px", color: VALUE, marginTop: "2px" }}>Not enrolled in any batch</div>
              </div>
            </button>
          )}

          {filteredBatches.length === 0 && unassignedStudents.length === 0 && (
            <EmptyState label="No batches found." />
          )}
        </div>
      )}
    </div>
  );

  // ── LEVEL 2: STUDENTS IN BATCH ────────────────────────
  const batchStudents =
    selectedBatch?.id === "__unassigned__"
      ? unassignedStudents
      : selectedBatch
      ? studentsInBatch(selectedBatch.id)
      : [];

  const filteredStudents = batchStudents.filter((s) =>
    fullName(s).toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.user?.email || "").toLowerCase().includes(studentSearch.toLowerCase())
  );

  const renderStudents = () => (
    <div className="animate-fade-in">
      <BackBar
        onBack={() => setLevel("batches")}
        crumb={["Batches", selectedBatch?.name || ""]}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 2px" }}>
            {selectedBatch?.name}
          </h2>
          <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>
            {batchStudents.length} {batchStudents.length === 1 ? "student" : "students"} enrolled
          </p>
        </div>
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: VALUE }} />
          <input
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Search students..."
            style={{
              width: "100%", padding: "10px 12px 10px 38px", borderRadius: "4px",
              border: "1px solid #dee2e6", fontSize: "14px", background: "#fff", outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, overflow: "hidden" }}>
        {filteredStudents.length === 0 ? (
          <EmptyState label="No students in this batch." />
        ) : (
          filteredStudents.map((s, i) => (
            <button
              key={s.id}
              onClick={() => openStudent(s)}
              style={{
                width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 18px", background: "#fff", border: "none",
                borderBottom: i < filteredStudents.length - 1 ? "1px solid #f0f1f4" : "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f7f8fc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                fontWeight: 700, fontSize: "14px", flexShrink: 0,
              }}>
                {initials(s)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#3a3f45" }}>{fullName(s)}</div>
                <div style={{ fontSize: "12px", color: VALUE, display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "2px" }}>
                  {s.user?.email && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={11} /> {s.user.email}</span>}
                  {s.user?.phone && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={11} /> {s.user.phone}</span>}
                </div>
              </div>
              <span style={{ fontSize: "13px", color: ACCENT, fontWeight: 600 }}>View →</span>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ── LEVEL 3: PROFILE ──────────────────────────────────
  const renderProfile = () => {
    const s: any = profile || selectedStudent || {};
    const subtitle = `${selectedBatch?.name || ""}${s.user?.email ? ` · ${s.user.email}` : ""}`.trim();
    return (
      <div className="animate-fade-in">
        <BackBar
          onBack={() => setLevel("students")}
          crumb={["Batches", selectedBatch?.name || "", fullName(selectedStudent)]}
        />
        <ProfileHeader name={fullName(selectedStudent)} subtitle={subtitle} />
        {profileLoading ? (
          <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW }}>
            <Spinner label="Loading profile..." />
          </div>
        ) : (
          <StudentProfileTabs student={s} batch={selectedBatch} />
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: FONT }}>
      {level === "batches" && renderBatches()}
      {level === "students" && renderStudents()}
      {level === "profile" && renderProfile()}
    </div>
  );
}

// ── Reusable pieces ───────────────────────────────────────
function BackBar({ onBack, crumb }: { onBack: () => void; crumb: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px",
          background: "#fff", border: "1px solid #dee2e6", borderRadius: "6px", cursor: "pointer",
          fontSize: "13px", fontWeight: 600, color: LABEL,
        }}
      >
        <ChevronLeft size={16} /> Back
      </button>
      <div style={{ fontSize: "13px", color: VALUE }}>
        {crumb.filter(Boolean).map((c, i, arr) => (
          <span key={i}>
            <span style={{ color: i === arr.length - 1 ? "#3a3f45" : VALUE, fontWeight: i === arr.length - 1 ? 600 : 400 }}>{c}</span>
            {i < arr.length - 1 && <span style={{ margin: "0 8px", color: "#c8cdd6" }}>/</span>}
          </span>
        ))}
      </div>
    </div>
  );
}


function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: "50px", textAlign: "center", color: "#a0a6ad", fontSize: "14px" }}>{label}</div>
  );
}
