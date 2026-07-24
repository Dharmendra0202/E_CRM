import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api";
import { useAttendanceRealtime } from "../utils/useAttendanceRealtime";
import { Activity, Check, CheckCircle2, Wifi, WifiOff, Users, Clock, TrendingUp } from "lucide-react";

interface AttendanceStudent {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  attendanceRate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | null;
  remarks: string;
  markedBy: string | null;
  markedAt: string | null;
}

interface AttendanceSession {
  batchId: string;
  batchName: string;
  subject: string;
  scheduleId: string;
  sessionDate: string;
  students: AttendanceStudent[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
  };
}

export function AttendanceTracker() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("Grade 10 Algebra");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [absenceAlertChecked, setAbsenceAlertChecked] = useState(true);
  const [notificationText, setNotificationText] = useState("");
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [batches, setBatches] = useState<any[]>([]);

  // Real-time WebSocket connection
  const { isConnected, lastUpdate } = useAttendanceRealtime({
    batchId: selectedBatchId,
    enabled: true,
    onUpdate: (update) => {
      console.log("📥 Live attendance update received:", update);
      
      // Show notification about the update
      if (update.source === "mobile") {
        setNotificationText(`📱 Attendance updated from mobile by ${update.markedBy || "Teacher"}`);
        setTimeout(() => setNotificationText(""), 4000);
      }

      // Refresh the session data to get the latest status
      loadAttendanceSession();
    },
  });

  // Load available batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.batches.getAll();
        if (res.data) {
          setBatches(res.data);
          // Set default batch
          if (res.data.length > 0) {
            setSelectedBatch(res.data[0].name);
            setSelectedBatchId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load batches:", err);
      }
    };
    fetchBatches();
  }, []);

  // Load attendance session when batch or date changes
  useEffect(() => {
    if (selectedBatchId && selectedDate) {
      loadAttendanceSession();
    }
  }, [selectedBatchId, selectedDate]);

  const loadAttendanceSession = async () => {
    if (!selectedBatchId) return;
    
    setIsLoading(true);
    try {
      const res = await api.attendance.getSession({
        batch_id: selectedBatchId,
        date: selectedDate,
      });
      if (res.status === "success" && res.data) {
        setSession(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load attendance session:", err);
      setNotificationText("❌ Failed to load attendance data.");
      setTimeout(() => setNotificationText(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchChange = (batchName: string) => {
    setSelectedBatch(batchName);
    const batch = batches.find((b) => b.name === batchName);
    if (batch) {
      setSelectedBatchId(batch.id);
    }
  };

  const handleToggleAttendance = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    if (!session) return;
    setSession({
      ...session,
      students: session.students.map((s) =>
        s.id === studentId ? { ...s, status } : s
      ),
    });
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (!session) return;
    setSession({
      ...session,
      students: session.students.map((s) =>
        s.id === studentId ? { ...s, remarks } : s
      ),
    });
  };

  const handleSaveAttendance = async () => {
    if (!session || !session.scheduleId) {
      setNotificationText("❌ No schedule found for this batch.");
      setTimeout(() => setNotificationText(""), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const records = session.students
        .filter((s) => s.status !== null)
        .map((s) => ({
          student_id: s.id,
          status: s.status,
          remarks: s.remarks || "",
        }));

      await api.attendance.submit({
        schedule_id: session.scheduleId,
        class_date: selectedDate,
        records,
      });

      const absent = session.students.filter((s) => s.status === "ABSENT").length;
      setNotificationText(
        `✅ Attendance saved for ${records.length} students.${
          absent > 0 && absenceAlertChecked ? ` ${absent} absence alert(s) queued.` : ""
        }`
      );
      setTimeout(() => setNotificationText(""), 5000);

      // Reload to show updated data
      await loadAttendanceSession();
    } catch (err: any) {
      console.error("Failed to save attendance:", err);
      setNotificationText("❌ Failed to save attendance. Please try again.");
      setTimeout(() => setNotificationText(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const summary = session?.summary || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    unmarked: 0,
  };

  const completionRate = summary.total > 0
    ? Math.round(((summary.present + summary.absent + summary.late) / summary.total) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>
            Attendance Tracker
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
            Select batch and date to log student attendance in real-time.
          </p>
        </div>
        
        {/* Live Connection Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "20px",
              background: isConnected ? "hsla(142,70%,40%,0.08)" : "hsla(342,90%,48%,0.08)",
              border: `1px solid ${isConnected ? "hsla(142,70%,40%,0.2)" : "hsla(342,90%,48%,0.2)"}`,
              fontSize: "12px",
              fontWeight: 700,
              color: isConnected ? "var(--color-success)" : "var(--color-danger)",
            }}
          >
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? "Live" : "Offline"}
            {isConnected && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--color-success)",
                  animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                }}
              />
            )}
          </div>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-success)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Activity size={14} />
            Week Rate: 93.8%
          </span>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationText && (
        <div
          style={{
            background: "hsla(142,70%,40%,0.08)",
            border: "1px solid hsla(142,70%,40%,0.2)",
            padding: "12px 16px",
            borderRadius: "10px",
            color: "var(--color-success)",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <CheckCircle2 size={16} />
          {notificationText}
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Students", value: summary.total, icon: <Users size={18} />, color: "hsl(200,95%,50%)" },
          { label: "Present", value: summary.present, icon: <CheckCircle2 size={18} />, color: "var(--color-success)" },
          { label: "Absent", value: summary.absent, icon: <Activity size={18} />, color: "var(--color-danger)" },
          { label: "Late", value: summary.late, icon: <Clock size={18} />, color: "hsl(38,92%,50%)" },
          { label: "Completion", value: `${completionRate}%`, icon: <TrendingUp size={18} />, color: "hsl(271,91%,60%)" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid var(--border-glass)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: `${stat.color}15`,
                  color: stat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {stat.icon}
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                {stat.label}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card style={{ padding: "20px", marginBottom: "20px", gap: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Class Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-glass)",
                background: "var(--surface-glass)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
              }}
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.name}>
                  {batch.name} ({batch.subject})
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: "190px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-glass)",
                background: "var(--surface-glass)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              paddingBottom: "2px",
            }}
          >
            <input
              type="checkbox"
              checked={absenceAlertChecked}
              onChange={(e) => setAbsenceAlertChecked(e.target.checked)}
              style={{ width: "15px", height: "15px", accentColor: "var(--color-accent)", cursor: "pointer" }}
            />
            Auto-Notify Parents
          </label>
        </div>
      </Card>

      {/* Attendance Table */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rect" height={70} />)}
        </div>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden", gap: 0 }}>
          {/* Column Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px 1fr",
              padding: "12px 24px",
              background: "rgba(29,10,39,0.03)",
              borderBottom: "1px solid var(--border-glass)",
              fontWeight: 700,
              fontSize: "12px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <div>Student</div>
            <div style={{ textAlign: "center" }}>Status</div>
            <div>Remarks</div>
          </div>

          {/* Student Rows */}
          {(session?.students ?? []).length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
              <Users size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No students found for this batch.</p>
            </div>
          ) : (
            (session?.students ?? []).map((student) => {
              const isMobileMark =
                lastUpdate?.records?.some((r) => r.studentId === student.id);

              return (
                <div
                  key={student.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 200px 1fr",
                    padding: "14px 24px",
                    borderBottom: "1px solid var(--border-glass)",
                    alignItems: "center",
                    gap: "16px",
                    background: isMobileMark ? "hsla(142,70%,40%,0.03)" : "transparent",
                    transition: "background 0.4s ease",
                  }}
                >

                  {/* Student Info */}
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "hsla(271,91%,60%,0.12)",
                        border: "2px solid hsla(271,91%,60%,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "hsl(271,91%,60%)",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      {student.initials}
                      {isMobileMark && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "hsl(200,95%,50%)",
                            border: "2px solid #fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "6px",
                            color: "#fff",
                          }}
                          title="Updated from mobile"
                        >
                          📱
                        </span>
                      )}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "var(--text-primary)" }}>
                        {student.name}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                        {student.email} · avg:{" "}
                        <strong style={{ color: "var(--color-success)" }}>{student.attendanceRate}</strong>
                        {student.markedBy && (
                          <span
                            style={{
                              marginLeft: "8px",
                              padding: "1px 6px",
                              background: "hsla(200,95%,50%,0.1)",
                              color: "hsl(200,95%,40%)",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            📱 {student.markedBy}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                    {(["PRESENT", "ABSENT", "LATE"] as const).map((s) => {
                      const isActive = student.status === s;
                      const colorMap = {
                        PRESENT: { active: "var(--color-success)", bg: "hsla(142,70%,40%,0.15)", border: "var(--color-success)" },
                        ABSENT:  { active: "var(--color-danger)",  bg: "hsla(342,90%,48%,0.15)", border: "var(--color-danger)"  },
                        LATE:    { active: "hsl(38,92%,50%)",      bg: "hsla(38,92%,50%,0.15)",  border: "hsl(38,92%,50%)"     },
                      }[s];
                      return (
                        <button
                          key={s}
                          onClick={() => handleToggleAttendance(student.id, s)}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            border: `2px solid ${isActive ? colorMap.border : "var(--border-glass)"}`,
                            background: isActive ? colorMap.bg : "transparent",
                            color: isActive ? colorMap.active : "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            transform: isActive ? "scale(1.05)" : "scale(1)",
                            boxShadow: isActive ? `0 4px 12px ${colorMap.active}33` : "none",
                          }}
                        >
                          {s[0]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Remarks Input */}
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={student.remarks}
                    onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-glass)",
                      background: "transparent",
                      fontSize: "12px",
                      outline: "none",
                      color: "var(--text-primary)",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-glass)")}
                  />
                </div>
              );
            })
          )}

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(29,10,39,0.02)",
              borderTop: "1px solid var(--border-glass)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              <strong>{selectedBatch}</strong> · <strong>{selectedDate}</strong> ·{" "}
              {summary.total} students ·{" "}
              <span style={{ color: "var(--color-success)", fontWeight: 700 }}>
                {summary.present} present
              </span>
              {summary.absent > 0 && (
                <>, <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>{summary.absent} absent</span></>
              )}
              {summary.late > 0 && (
                <>, <span style={{ color: "hsl(38,92%,50%)", fontWeight: 700 }}>{summary.late} late</span></>
              )}
            </span>
            <Button
              variant="primary"
              isLoading={isSaving}
              onClick={handleSaveAttendance}
              leftIcon={<Check size={15} />}
            >
              Save & Notify
            </Button>
          </div>
        </Card>
      )}

      {/* Mobile Sync Guide */}
      <div
        style={{
          marginTop: "20px",
          padding: "16px 20px",
          borderRadius: "12px",
          background: "hsla(200,95%,50%,0.05)",
          border: "1px solid hsla(200,95%,50%,0.15)",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "hsla(200,95%,50%,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "16px",
          }}
        >
          📱
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Mobile Attendance Sync
          </p>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Teachers can mark attendance from any mobile device. Changes appear here instantly via WebSocket.
            Use the API endpoint below from your mobile app or tool like Postman:
          </p>
          <code
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              background: "hsla(200,95%,50%,0.08)",
              padding: "8px 12px",
              borderRadius: "6px",
              display: "block",
              color: "hsl(200,95%,35%)",
              wordBreak: "break-all",
            }}
          >
            POST /api/v1/attendance/mark · Body: {"{"}schedule_id, student_id, class_date, status, remarks{"}"}
          </code>
        </div>
      </div>
    </div>
  );
}
