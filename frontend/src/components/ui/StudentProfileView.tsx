import { useState } from "react";
import { GraduationCap, User, MapPin, BookOpen, IndianRupee } from "lucide-react";
import { ACCENT, ACCENT_DARK, FIELD_BG, LABEL, CARD_SHADOW } from "../../utils/theme";

type ProfileTab = "personal" | "academic" | "address" | "subject" | "fees";

export interface ProfileBatch { id?: string; name?: string; subject?: string; feeAmount?: number; }
export interface ProfileStudent {
  id?: string;
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  parentName?: string; parentPhone?: string; parentEmail?: string;
  motherName?: string; motherPhone?: string;
  gender?: string; address?: string; dateOfBirth?: string;
  bloodGroup?: string; schoolName?: string; currentClass?: string;
  city?: string; state?: string; pinCode?: string;
  invoices?: any[];
  createdAt?: string;
}

const TABS: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User size={16} /> },
  { id: "academic", label: "Academic", icon: <GraduationCap size={16} /> },
  { id: "address", label: "Address", icon: <MapPin size={16} /> },
  { id: "subject", label: "Subject", icon: <BookOpen size={16} /> },
  { id: "fees", label: "Fees", icon: <IndianRupee size={16} /> },
];

/** The shared tabbed student profile body (Personal / Academic / Address / Subject / Fees). */
export function StudentProfileTabs({ student, batch }: { student: ProfileStudent; batch: ProfileBatch | null }) {
  const [tab, setTab] = useState<ProfileTab>("personal");
  return (
    <div className="sp-profile-layout" style={{ display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
      <div className="sp-profile-tabs" style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, padding: "8px", minWidth: "180px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px",
              borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600,
              textAlign: "left", transition: "background 0.15s",
              background: tab === t.id ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : "transparent",
              color: tab === t.id ? "#fff" : LABEL,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="sp-profile-content" style={{ flex: 1, minWidth: "300px" }}>
        {tab === "personal" && <PersonalTab s={student} />}
        {tab === "academic" && <AcademicTab s={student} batch={batch} />}
        {tab === "address" && <AddressTab s={student} />}
        {tab === "subject" && <SubjectTab batch={batch} />}
        {tab === "fees" && <FeesTab s={student} batch={batch} />}
      </div>
    </div>
  );
}

/** Gradient profile header with avatar + name. */
export function ProfileHeader({ name, subtitle, rounded = true, right }: { name: string; subtitle?: string; rounded?: boolean; right?: React.ReactNode }) {
  const initials = name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "S";
  return (
    <div style={{
      background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
      borderRadius: rounded ? "10px" : "12px 12px 0 0",
      padding: "22px 26px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "18px", marginBottom: rounded ? "18px" : 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px", minWidth: 0 }}>
        <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</h2>
          {subtitle && <div style={{ fontSize: "13px", opacity: 0.9 }}>{subtitle}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ── Reusable field primitives ─────────────────────────────
export function fmtDate(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, marginBottom: "18px", overflow: "hidden" }}>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid #f0f1f4", fontSize: "15px", fontWeight: 700, color: "#3a3f45" }}>{title}</div>
      <div style={{ padding: "22px" }}>{children}</div>
    </div>
  );
}
export function Field({ label, value, required }: { label: string; value?: string; required?: boolean }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3a3f45", marginBottom: "6px" }}>
        {required && <span style={{ color: "#dc3545" }}>* </span>}{label}
      </label>
      <div style={{ background: FIELD_BG, borderRadius: "4px", padding: "10px 14px", fontSize: "14px", color: value ? "#3a3f45" : "#a0a6ad", minHeight: "40px", display: "flex", alignItems: "center" }}>
        {value || "—"}
      </div>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 22px" }}>{children}</div>;
}

// ── Tabs ──────────────────────────────────────────────────
function PersonalTab({ s }: { s: ProfileStudent }) {
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
function AcademicTab({ s, batch }: { s: ProfileStudent; batch: ProfileBatch | null }) {
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
function AddressTab({ s }: { s: ProfileStudent }) {
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
function SubjectTab({ batch }: { batch: ProfileBatch | null }) {
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
          <span>MJ</span><span>{batch?.subject || "General"}</span><span style={{ color: "#28a745", fontWeight: 600 }}>Allotted</span>
        </div>
      </div>
    </Section>
  );
}
function FeesTab({ s, batch }: { s: ProfileStudent; batch: ProfileBatch | null }) {
  const invoices = s.invoices || [];
  const applicable = batch?.feeAmount ? Number(batch.feeAmount) : invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const paid = invoices.reduce((sum, i) => sum + (i.payments || []).reduce((p: number, x: any) => p + Number(x.amount || 0), 0), 0);
  const balance = Math.max(0, applicable - paid);
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
          <span>₹{balance.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 14px", fontSize: "13px", fontWeight: 800, color: "#3a3f45" }}>
          <span>Total</span>
          <span>₹{applicable.toLocaleString("en-IN")}</span>
          <span>₹{paid.toLocaleString("en-IN")}</span>
          <span>₹{balance.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </Section>
  );
}
