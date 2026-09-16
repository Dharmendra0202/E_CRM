import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Award, Bell, CalendarDays, Loader2, TrendingUp } from "lucide-react";

const ACCENT = "#007bff";
const LABEL = "#60686f";
const VALUE = "#6c757d";
const CARD_SHADOW = "rgba(90, 97, 105, 0.1) 0px 7.5px 35px 0px, rgba(90, 97, 105, 0.1) 0px 2px 3px 0px";
const FONT = "'Nunito', 'Segoe UI', Arial, sans-serif";

const PRESENT = "#4285f4";
const ABSENT = "#e3342f";
const LEAVE = "#f5c518";

interface Props {
  userName: string;
  onNavigate: (view: string) => void;
}

export function StudentDashboard({ userName, onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, late: 0, total: 0, percentage: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [att, res, notif, classes] = await Promise.allSettled([
        api.attendance.getMySummary(),
        api.exams2.myResults(),
        api.notifications.getAll({ limit: "8" }),
        api.onlineClasses.getAll("today"),
      ]);
      if (att.status === "fulfilled") setAttendance(att.value.data || attendance);
      if (res.status === "fulfilled") setResults(res.value.data || []);
      if (notif.status === "fulfilled") setNotices(notif.value.data || []);
      if (classes.status === "fulfilled") setTodayEvents(classes.value.data || []);
      setLoading(false);
    })();
    // eslint-disable-next-line
  }, []);

  const firstName = userName?.split(" ")[0] || "Student";

  // Donut segments
  const { present, absent, late, total } = attendance;
  const leave = late; // treat LATE as leave bucket for the chart
  const seg = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const donutBg = total > 0
    ? `conic-gradient(${PRESENT} 0% ${seg(present)}%, ${ABSENT} ${seg(present)}% ${seg(present) + seg(absent)}%, ${LEAVE} ${seg(present) + seg(absent)}% 100%)`
    : "conic-gradient(#e9ecf3 0% 100%)";

  const timeAgo = (iso: string) => {
    const d = new Date(iso).getTime();
    if (isNaN(d)) return "";
    const min = Math.floor((Date.now() - d) / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: FONT }}>
      {/* Greeting */}
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 2px" }}>
          Welcome back, {firstName} 👋
        </h2>
        <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>Here's your academic overview.</p>
      </div>

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: VALUE }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ marginTop: "10px", fontSize: "14px" }}>Loading your dashboard...</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", alignItems: "start" }}>
          {/* LEFT: Result + Attendance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Term-wise Result */}
            <Card title="Term-wise Result" icon={<Award size={17} />}>
              {results.length === 0 ? (
                <Empty text="No results published yet." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {results.slice(0, 5).map((r) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f7f8fc", borderRadius: "8px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#3a3f45" }}>{r.examTitle}</div>
                        <div style={{ fontSize: "11px", color: VALUE }}>{r.subject} · {r.examType}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: r.passed ? "#38c172" : ABSENT }}>{r.marks}/{r.totalMarks}</div>
                        <div style={{ fontSize: "11px", color: VALUE }}>{r.percentage}% · {r.grade || "—"}</div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => onNavigate("marksheet")} style={linkBtn}>View all marks →</button>
                </div>
              )}
            </Card>

            {/* Attendance donut */}
            <Card title="Attendance" icon={<TrendingUp size={17} />}>
              {total === 0 ? (
                <Empty text="No attendance recorded yet." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                  {/* Legend */}
                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: 600, color: LABEL }}>
                    <Legend color={PRESENT} label="PRESENT" />
                    <Legend color={ABSENT} label="ABSENT" />
                    <Legend color={LEAVE} label="LEAVE" />
                  </div>
                  {/* Donut */}
                  <div style={{ position: "relative", width: "170px", height: "170px" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: donutBg }} />
                    <div style={{
                      position: "absolute", inset: "26px", background: "#fff", borderRadius: "50%",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ fontSize: "26px", fontWeight: 800, color: ACCENT }}>{attendance.percentage}%</div>
                      <div style={{ fontSize: "11px", color: VALUE }}>Overall</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: LABEL }}>
                    <span><b style={{ color: PRESENT }}>{present}</b> Present</span>
                    <span><b style={{ color: ABSENT }}>{absent}</b> Absent</span>
                    <span><b style={{ color: "#c9a800" }}>{leave}</b> Leave</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT: Notice + Today's Events */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Notice */}
            <Card title="Notice" icon={<Bell size={17} />}>
              {notices.length === 0 ? (
                <Empty text="No new notices." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {notices.map((n, i) => (
                    <div key={n.id} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: i < notices.length - 1 ? "1px solid #f0f1f4" : "none" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#eef0fe", color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#3a3f45" }}>{n.title}</div>
                        <div style={{ fontSize: "12px", color: VALUE, marginTop: "2px" }}>{n.message}</div>
                        <div style={{ fontSize: "10px", color: "#a0a6ad", marginTop: "3px" }}>{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Today's Events */}
            <Card title="Today's Events" icon={<CalendarDays size={17} />}>
              {todayEvents.length === 0 ? (
                <Empty text="Event Not Available." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {todayEvents.map((e) => (
                    <div key={e.id} style={{ padding: "10px 12px", background: "#f7f8fc", borderRadius: "8px", borderLeft: `3px solid ${ACCENT}` }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#3a3f45" }}>{e.subjectName} — {e.courseName}</div>
                      <div style={{ fontSize: "11px", color: VALUE, marginTop: "2px" }}>{e.scheduleTime}{e.teacherName ? ` · ${e.teacherName}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 18px", borderBottom: "1px solid #f0f1f4", fontSize: "15px", fontWeight: 700, color: "#3a3f45" }}>
        <span style={{ color: ACCENT }}>{icon}</span> {title}
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: color }} /> {label}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return <div style={{ padding: "24px", textAlign: "center", color: "#a0a6ad", fontSize: "13px" }}>{text}</div>;
}
const linkBtn: React.CSSProperties = {
  marginTop: "4px", background: "transparent", border: "none", color: ACCENT, fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "right", padding: "4px 0",
};
