import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { FileText, Loader2, Search } from "lucide-react";

const ACCENT = "#007bff";
const ACCENT_DARK = "#0069d9";
const LABEL = "#60686f";
const VALUE = "#6c757d";
const CARD_SHADOW = "rgba(90, 97, 105, 0.1) 0px 7.5px 35px 0px, rgba(90, 97, 105, 0.1) 0px 2px 3px 0px";
const FONT = "'Nunito', 'Segoe UI', Arial, sans-serif";

interface Record {
  id: string;
  date: string;
  studentName: string;
  batchName: string;
  subject: string;
  status: string;
  remarks: string;
}
interface Batch { id: string; name: string; }

const STATUS_COLOR: Record<string, string> = {
  PRESENT: "#38c172", ABSENT: "#e3342f", LATE: "#f5a623",
};

export function AttendanceDetails({ userRole = "STUDENT" }: { userRole?: string }) {
  // Students see only their own records — no batch filter. Admin/teacher can filter.
  const canFilterBatches = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "TEACHER";

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [batchId, setBatchId] = useState("all");
  const [batches, setBatches] = useState<Batch[]>([]);

  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (canFilterBatches) {
      api.batches.getAll().then((r) => setBatches(r.data || [])).catch(() => setBatches([]));
    }
  }, [canFilterBatches]);

  const show = async () => {
    if (!from || !to) { setError("Please select both From and To dates."); return; }
    if (new Date(from) > new Date(to)) { setError("From date cannot be after To date."); return; }
    setError("");
    setLoading(true);
    setHasSearched(true);
    try {
      const params: any = { from, to };
      if (batchId !== "all") params.batch_id = batchId;
      const res = await api.attendance.getRange(params);
      setRecords(res.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load records.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d: string) => {
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FileText size={22} style={{ color: ACCENT }} /> Attendance Datewise Details
        </h2>
        <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>Select a date range to view attendance records.</p>
      </div>

      {/* Filter card */}
      <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, padding: "24px", marginBottom: "18px" }}>
        {error && <div style={{ background: "#fdecec", color: "#e3342f", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
          <div>
            <Label required>From Date</Label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <Label required>To Date</Label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
          </div>
          {canFilterBatches && (
            <div>
              <Label>Batch</Label>
              <select value={batchId} onChange={(e) => setBatchId(e.target.value)} style={inputStyle}>
                <option value="all">All Batches</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={show} disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px 22px", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, height: "42px", opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} />} Show
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: VALUE }}>
              <Loader2 size={26} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "14px" }}>Loading records...</span>
            </div>
          ) : records.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#a0a6ad", fontSize: "14px" }}>
              No attendance records found in this range.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "#fafbfe", color: LABEL }}>
                    <Th>Sr.No</Th>
                    <Th align="left">Date</Th>
                    <Th align="left">Student</Th>
                    <Th align="left">Batch</Th>
                    <Th align="left">Subject</Th>
                    <Th>Status</Th>
                    <Th align="left">Remarks</Th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f0f1f4" }}>
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#5a6169" }}>{i + 1}</td>
                      <td style={{ padding: "12px 16px", color: "#3a3f45", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(r.date)}</td>
                      <td style={{ padding: "12px 16px", color: "#5a6169" }}>{r.studentName}</td>
                      <td style={{ padding: "12px 16px", color: "#5a6169" }}>{r.batchName}</td>
                      <td style={{ padding: "12px 16px", color: "#5a6169" }}>{r.subject}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "4px 12px", borderRadius: "20px",
                          border: `1px solid ${STATUS_COLOR[r.status] || VALUE}`, color: STATUS_COLOR[r.status] || VALUE,
                          fontWeight: 700, fontSize: "12px",
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#5a6169" }}>{r.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #dee2e6",
  fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#fff", height: "42px",
};
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3a3f45", marginBottom: "6px" }}>
    {required && <span style={{ color: "#e3342f" }}>* </span>}{children}
  </label>;
}
function Th({ children, align = "center" }: { children: React.ReactNode; align?: "left" | "center" }) {
  return <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, textAlign: align, borderBottom: "2px solid #eef0f4", whiteSpace: "nowrap" }}>{children}</th>;
}
