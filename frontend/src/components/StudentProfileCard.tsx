import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "../utils/api";
import { FONT } from "../utils/theme";
import { Spinner } from "./ui/Spinner";
import { StudentProfileTabs, ProfileHeader } from "./ui/StudentProfileView";

interface Props {
  studentId: string;
  onClose?: () => void;
  asModal?: boolean;
}

/**
 * Renders a student's full profile the SAME way as the Student Profiles section
 * (tabbed: Personal / Academic / Address / Subject / Fees). Fetches by id.
 */
export function StudentProfileCard({ studentId, onClose, asModal = true }: Props) {
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.students.getProfile(studentId);
        setS(res.data || null);
      } catch {
        setS(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const fullName = s?.user ? `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() : "Student";
  const batch = s?.enrollments?.[0]?.batch || null;
  const subtitle = `${batch?.name || ""}${s?.user?.email ? ` · ${s.user.email}` : ""}`.trim();

  const inner = (
    <div style={{ fontFamily: FONT }}>
      <ProfileHeader
        name={fullName}
        subtitle={subtitle}
        rounded={!asModal}
        right={asModal && onClose ? (
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
            <X size={18} />
          </button>
        ) : undefined}
      />
      <div style={{ padding: asModal ? "18px 22px 22px" : 0 }}>
        {loading ? <Spinner label="Loading profile..." />
          : !s ? <div style={{ padding: "40px", textAlign: "center", color: "#a0a6ad" }}>Student not found.</div>
          : <StudentProfileTabs student={s} batch={batch} />}
      </div>
    </div>
  );

  if (!asModal) return inner;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#f6f6f6", borderRadius: "12px", width: "100%", maxWidth: "760px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        {inner}
      </div>
    </div>
  );
}
