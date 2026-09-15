import { useState, useEffect } from "react";
import { api } from "../utils/api";
import {
  Users2, ChevronLeft, Search, GraduationCap, User, MapPin,
  BookOpen, IndianRupee, Layers, Mail, Phone, Loader2,
} from "lucide-react";

// ── MasterSoft theme tokens ──────────────────────────────
const ACCENT = "#6777ef";
const ACCENT_DARK = "#5a68d8";
const FIELD_BG = "#e9ecf3";
const LABEL = "#60686f";
const VALUE = "#6c757d";
const CARD_SHADOW = "rgba(90, 97, 105, 0.1) 0px 7.5px 35px 0px, rgba(90, 97, 105, 0.1) 0px 2px 3px 0px";

type Level = "batches" | "students" | "profile";
type ProfileTab = "personal" | "academic" | "address" | "subject" | "fees";

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

export function StudentProfiles() {
  const [level, setLevel] = useState<Level>("batches");
  const [tab, setTab] = useState<ProfileTab>("personal");

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
    setTab("personal");
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

  const fullName = (s?: Student) =>
    `${s?.user?.firstName || ""} ${s?.user?.lastName || ""}`.trim() || "Unnamed Student";

  const initials = (s?: Student) => {
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
        <LoadingBlock label="Loading batches..." />
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
                    padding: "4px 12px", borderRadius: "20px",
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
                <span style={{ background: "#eef0f4", color: VALUE, fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px" }}>
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
  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: "personal", label: "Personal", icon: <User size={16} /> },
    { id: "academic", label: "Academic", icon: <GraduationCap size={16} /> },
    { id: "address", label: "Address", icon: <MapPin size={16} /> },
    { id: "subject", label: "Subject", icon: <BookOpen size={16} /> },
    { id: "fees", label: "Fees", icon: <IndianRupee size={16} /> },
  ];

  const renderProfile = () => {
    const s: Student = profile || selectedStudent || {};
    return (
      <div className="animate-fade-in">
        <BackBar
          onBack={() => setLevel("students")}
          crumb={["Batches", selectedBatch?.name || "", fullName(selectedStudent)]}
        />

        {/* Profile header */}
        <div style={{
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, borderRadius: "10px",
          padding: "22px 26px", color: "#fff", display: "flex", alignItems: "center", gap: "18px",
          marginBottom: "18px",
        }}>
          <div style={{
            width: "62px", height: "62px", borderRadius: "50%", background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800,
          }}>
            {initials(selectedStudent)}
          </div>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: "22px", fontWeight: 800 }}>{fullName(selectedStudent)}</h2>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>
              {selectedBatch?.name} {s.user?.email ? `· ${s.user.email}` : ""}
            </div>
          </div>
        </div>

        <div className="sp-profile-layout" style={{ display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Tab sidebar */}
          <div className="sp-profile-tabs" style={{
            background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, padding: "8px",
            minWidth: "190px", display: "flex", flexDirection: "column", gap: "2px",
          }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                  borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600,
                  textAlign: "left", transition: "background 0.15s",
                  background: tab === t.id ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : "transparent",
                  color: tab === t.id ? "#fff" : LABEL,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="sp-profile-content" style={{ flex: 1, minWidth: "320px" }}>
            {profileLoading ? (
              <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW }}>
                <LoadingBlock label="Loading profile..." />
              </div>
            ) : (
              <>
                {tab === "personal" && <PersonalTab s={s} />}
                {tab === "academic" && <AcademicTab s={s} batch={selectedBatch} />}
                {tab === "address" && <AddressTab s={s} />}
                {tab === "subject" && <SubjectTab batch={selectedBatch} />}
                {tab === "fees" && <FeesTab s={s} batch={selectedBatch} />}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: '"Lucida Grande", Helvetica, Arial, Verdana, sans-serif' }}>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, marginBottom: "18px", overflow: "hidden" }}>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid #f0f1f4", fontSize: "15px", fontWeight: 700, color: "#3a3f45" }}>
        {title}
      </div>
      <div style={{ padding: "22px" }}>{children}</div>
    </div>
  );
}

function Field({ label, value, required }: { label: string; value?: string; required?: boolean }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3a3f45", marginBottom: "6px" }}>
        {required && <span style={{ color: "#e3342f" }}>* </span>}{label}
      </label>
      <div style={{
        background: FIELD_BG, borderRadius: "4px", padding: "10px 14px", fontSize: "14px",
        color: value ? "#3a3f45" : "#a0a6ad", minHeight: "40px", display: "flex", alignItems: "center",
      }}>
        {value || "—"}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0 22px" }}>{children}</div>;
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div style={{ padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#6c757d" }}>
      <Loader2 size={28} className="spin" style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: "14px" }}>{label}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: "50px", textAlign: "center", color: "#a0a6ad", fontSize: "14px" }}>{label}</div>
  );
}

// ── Tab contents ──────────────────────────────────────────
function fmtDate(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function PersonalTab({ s }: { s: Student }) {
  return (
    <Section title="My Details">
      <Grid>
        <Field label="First Name" value={s.user?.firstName} required />
        <Field label="Last Name / Surname" value={s.user?.lastName} required />
        <Field label="Gender" value={s.gender} />
        <Field label="Mobile" value={s.user?.phone} />
        <Field label="Email" value={s.user?.email} />
        <Field label="Date of Birth" value={fmtDate(s.dateOfBirth)} required />
        <Field label="Father / Parent Name" value={s.parentName} />
        <Field label="Parent Phone" value={s.parentPhone} />
        <Field label="Parent Email" value={s.parentEmail} />
        <Field label="Mother Name" value={s.motherName} />
        <Field label="Mother Phone" value={s.motherPhone} />
        <Field label="Blood Group" value={s.bloodGroup} />
        <Field label="School / College" value={s.schoolName} />
        <Field label="Current Class / Grade" value={s.currentClass} />
      </Grid>
    </Section>
  );
}

function AcademicTab({ s, batch }: { s: Student; batch: Batch | null }) {
  const totalFees = (s.invoices || []).reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  return (
    <>
      <Section title="Academic Details">
        <Grid>
          <Field label="Name" value={`${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim()} />
          <Field label="Student ID" value={s.id?.slice(0, 8).toUpperCase()} />
          <Field label="Course / Batch" value={batch?.name} />
          <Field label="Subject" value={batch?.subject} />
          <Field label="Current Class" value={s.currentClass} />
          <Field label="School / College" value={s.schoolName} />
          <Field label="Session" value={new Date().getFullYear() + "-" + (new Date().getFullYear() + 1)} />
          <Field label="Admission Date" value={fmtDate(s.createdAt)} />
        </Grid>
      </Section>
      <Section title="Payment Details">
        <Grid>
          <Field label="Fee Type" value="GENERAL" />
          <Field label="Total Fees" value={totalFees ? `₹${totalFees.toLocaleString("en-IN")}` : undefined} />
          <Field label="Admission Status" value="ADMITTED" />
        </Grid>
      </Section>
    </>
  );
}

function AddressTab({ s }: { s: Student }) {
  return (
    <Section title="Address">
      <Grid>
        <Field label="Country" value="INDIA" />
        <Field label="State" value={s.state} />
        <Field label="City" value={s.city} />
        <Field label="Pin Code" value={s.pinCode} />
      </Grid>
      <Field label="Full Address" value={s.address} />
    </Section>
  );
}

function SubjectTab({ batch }: { batch: Batch | null }) {
  return (
    <Section title="Subject Details">
      <div style={{ marginBottom: "18px", maxWidth: "300px" }}>
        <Field label="Medium" value="ENGLISH" required />
      </div>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#3a3f45", marginBottom: "10px" }}>Assigned Subjects</div>
      <div style={{ border: "1px solid #f0f1f4", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px", padding: "10px 14px", background: "#f7f8fc", fontSize: "12px", fontWeight: 700, color: LABEL }}>
          <span>Code</span><span>Subject Name</span><span>Status</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px", padding: "12px 14px", fontSize: "13px", color: "#3a3f45" }}>
          <span>MJ</span><span>{batch?.subject || "General"}</span><span style={{ color: "#38c172", fontWeight: 600 }}>Allotted</span>
        </div>
      </div>
    </Section>
  );
}

function FeesTab({ s, batch }: { s: Student; batch: Batch | null }) {
  const invoices = s.invoices || [];
  const applicable = batch?.feeAmount ? Number(batch.feeAmount) : invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const paid = invoices.reduce((sum, i) => sum + (i.payments || []).reduce((p: number, x: any) => p + Number(x.amount || 0), 0), 0);
  return (
    <Section title="Admission Fees Details">
      <div style={{ border: "1px solid #f0f1f4", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 14px", background: "#f7f8fc", fontSize: "12px", fontWeight: 700, color: LABEL }}>
          <span>Course</span><span>Applicable</span><span>Paid</span><span>Balance</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 14px", fontSize: "13px", color: "#3a3f45", borderBottom: "1px solid #f0f1f4" }}>
          <span>{batch?.name || "—"}</span>
          <span>₹{applicable.toLocaleString("en-IN")}</span>
          <span>₹{paid.toLocaleString("en-IN")}</span>
          <span>₹{Math.max(0, applicable - paid).toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 14px", fontSize: "13px", fontWeight: 800, color: "#3a3f45" }}>
          <span>Total</span>
          <span>₹{applicable.toLocaleString("en-IN")}</span>
          <span>₹{paid.toLocaleString("en-IN")}</span>
          <span>₹{Math.max(0, applicable - paid).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </Section>
  );
}
