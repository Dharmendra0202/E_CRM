import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Check, Loader2, TrendingUp } from "lucide-react";

const ACCENT = "#007bff";
const LABEL = "#60686f";
const VALUE = "#6c757d";
const CARD_SHADOW = "rgba(90, 97, 105, 0.1) 0px 7.5px 35px 0px, rgba(90, 97, 105, 0.1) 0px 2px 3px 0px";
const FONT = "'Nunito', 'Segoe UI', Arial, sans-serif";

interface Row {
  batchId: string;
  subjectName: string;
  teacherName: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}
interface Batch { id: string; name: string; }

export function ClassAttendance({ userRole = "ADMIN" }: { userRole?: string }) {
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "TEACHER";

  const [rows, setRows] = useState<Row[]>([]);
  const [overall, setOverall] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchFilter, setBatchFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const params = batchFilter !== "all" ? { batch_id: batchFilter } : undefined;
      const res = await api.attendance.getSummary(params);
      setRows(res.data?.rows || []);
      setOverall(res.data?.overallPercentage || 0);
    } catch {
      setRows([]);
      setOverall(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.batches.getAll().then((r) => setBatches(r.data || [])).catch(() => setBatches([]));
  }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [batchFilter]);

  const filtered = rows.filter((r) =>
    [r.subjectName, r.teacherName].some((v) => (v || "").toLowerCase().includes(search.toLowerCase()))
  );

  const pctColor = (p: number) => (p >= 75 ? "#38c172" : p >= 50 ? "#f5a623" : "#e3342f");

  return (
    <div className="animate-fade-in" style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Check size={22} style={{ color: ACCENT }} /> Class Attendance
          </h2>
          <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>
            {isAdmin ? "Subject-wise attendance summary across batches." : "Your subject-wise attendance record."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
            border: `1px solid ${ACCENT}`, borderRadius: "6px", color: ACCENT, fontWeight: 700, fontSize: "13px", background: "#eef0fe",
          }}>
            <TrendingUp size={15} /> Overall: {overall}%
          </div>
          <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}
            style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "14px", background: "#fff", outline: "none" }}>
            <option value="all">All Batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px", borderBottom: "1px solid #f0f1f4" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject or teacher..."
            style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "14px", outline: "none", minWidth: "260px" }} />
        </div>

        {isLoading ? (
          <div style={{ padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: VALUE }}>
            <Loader2 size={26} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "14px" }}>Loading attendance...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#a0a6ad", fontSize: "14px" }}>
            No attendance records yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "720px" }}>
              <thead>
                <tr style={{ background: "#fafbfe", color: LABEL }}>
                  <Th align="left">Subject Name</Th>
                  <Th align="left">Teacher Name</Th>
                  <Th>Total Lecture</Th>
                  <Th>Present Lecture</Th>
                  <Th>Absent Lecture</Th>
                  <Th>Percentage</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.batchId} style={{ borderBottom: "1px solid #f0f1f4" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#3a3f45" }}>{r.subjectName}</td>
                    <td style={{ padding: "14px 16px", color: "#5a6169" }}>{r.teacherName}</td>
                    <td style={{ padding: "14px 16px", textAlign: "center", color: "#5a6169" }}>{r.total}</td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <Pill value={r.present + r.late} color="#38c172" />
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <Pill value={r.absent} color="#f5a623" />
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <Pill value={`${r.percentage}`} color={pctColor(r.percentage)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, align = "center" }: { children: React.ReactNode; align?: "left" | "center" }) {
  return <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, textAlign: align, borderBottom: "2px solid #eef0f4", whiteSpace: "nowrap" }}>{children}</th>;
}
function Pill({ value, color }: { value: string | number; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "42px",
      padding: "4px 12px", borderRadius: "20px", border: `1px solid ${color}`, color, fontWeight: 700, fontSize: "12px",
    }}>
      {value}
    </span>
  );
}
