import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Clock, X, Users2, IndianRupee, BookOpen } from "lucide-react";

interface NotificationCenterProps {
  invoiceCount: number;
  studentCount: number;
  homeworkCount: number;
}

export function NotificationCenter({ invoiceCount, studentCount, homeworkCount }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate notifications from real data
  const notifications = [
    ...(invoiceCount > 0 ? [{ id: "inv", icon: <IndianRupee size={14} />, color: "var(--color-danger)", title: `${invoiceCount} unpaid invoice${invoiceCount > 1 ? "s" : ""}`, desc: "Fee reminders pending", time: "Now" }] : []),
    ...(studentCount > 0 ? [{ id: "stu", icon: <Users2 size={14} />, color: "hsl(271,91%,60%)", title: `${studentCount} new student${studentCount > 1 ? "s" : ""} this month`, desc: "Review enrollments", time: "Today" }] : []),
    ...(homeworkCount > 0 ? [{ id: "hw", icon: <BookOpen size={14} />, color: "hsl(38,92%,50%)", title: `${homeworkCount} active assignment${homeworkCount > 1 ? "s" : ""}`, desc: "Check submissions", time: "Ongoing" }] : []),
    { id: "welcome", icon: <CheckCircle2 size={14} />, color: "var(--color-success)", title: "System operational", desc: "All services running normally", time: "Always" },
  ];

  const totalBadge = notifications.length;

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handler); };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "36px", height: "36px", borderRadius: "10px",
          border: "1px solid var(--border-glass)", background: isOpen ? "hsla(328,100%,54%,0.08)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative", transition: "all 0.2s",
          color: isOpen ? "var(--color-accent)" : "var(--text-secondary)",
        }}
      >
        <Bell size={17} />
        {totalBadge > 0 && (
          <span style={{
            position: "absolute", top: "-3px", right: "-3px",
            width: "16px", height: "16px", borderRadius: "50%",
            background: "var(--color-danger)", color: "#fff",
            fontSize: "9px", fontWeight: 800, display: "flex",
            alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {totalBadge}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: "340px", background: "#fff", borderRadius: "16px",
            border: "1px solid var(--border-glass)",
            boxShadow: "0 16px 48px rgba(29,10,39,0.15)",
            overflow: "hidden", zIndex: 9999,
          }}
          className="animate-slide-up"
        >
          {/* Header */}
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Notifications</h4>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.08)", padding: "2px 8px", borderRadius: "10px" }}>{totalBadge} new</span>
          </div>

          {/* List */}
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.map((notif) => (
              <div key={notif.id} style={{ display: "flex", gap: "12px", padding: "12px 18px", borderBottom: "1px solid var(--border-glass)", transition: "background 0.15s", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "hsla(328,100%,54%,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `${notif.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: notif.color, flexShrink: 0 }}>
                  {notif.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{notif.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{notif.desc}</p>
                </div>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, flexShrink: 0 }}>{notif.time}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border-glass)", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", cursor: "pointer" }}>View All Notifications</span>
          </div>
        </div>
      )}
    </div>
  );
}
