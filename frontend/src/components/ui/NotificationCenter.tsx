import { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, Users2, IndianRupee, BookOpen, CalendarDays, Clock } from "lucide-react";
import { api } from "../../utils/api";

interface NotificationCenterProps {
  invoiceCount: number;
  studentCount: number;
  homeworkCount: number;
}

interface DbNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  ATTENDANCE: { icon: <CheckCircle2 size={14} />, color: "var(--color-success)" },
  EXAM: { icon: <BookOpen size={14} />, color: "hsl(38,92%,50%)" },
  HOMEWORK: { icon: <BookOpen size={14} />, color: "hsl(38,92%,50%)" },
  FEE: { icon: <IndianRupee size={14} />, color: "var(--color-danger)" },
  GENERAL: { icon: <CalendarDays size={14} />, color: "#0069d9" },
  SYSTEM: { icon: <Clock size={14} />, color: "var(--text-secondary)" },
};

export function NotificationCenter({ invoiceCount, studentCount, homeworkCount }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dbNotifs, setDbNotifs] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll({ limit: "20" });
      setDbNotifs(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      setDbNotifs([]);
    }
  };

  // Poll notifications every 30s + on mount
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload when opening the dropdown
  useEffect(() => { if (isOpen) loadNotifications(); }, [isOpen]);

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setDbNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  // Real DB notifications (mapped) + derived system items
  const realItems = dbNotifs.map((n) => {
    const meta = TYPE_ICON[n.type] || TYPE_ICON.GENERAL;
    return { id: n.id, icon: meta.icon, color: meta.color, title: n.title, desc: n.message, time: timeAgo(n.createdAt), isRead: n.isRead };
  });

  const derivedItems = [
    ...(invoiceCount > 0 ? [{ id: "inv", icon: <IndianRupee size={14} />, color: "var(--color-danger)", title: `${invoiceCount} unpaid invoice${invoiceCount > 1 ? "s" : ""}`, desc: "Fee reminders pending", time: "Now", isRead: true }] : []),
    ...(studentCount > 0 ? [{ id: "stu", icon: <Users2 size={14} />, color: "#0069d9", title: `${studentCount} new student${studentCount > 1 ? "s" : ""} this month`, desc: "Review enrollments", time: "Today", isRead: true }] : []),
    ...(homeworkCount > 0 ? [{ id: "hw", icon: <BookOpen size={14} />, color: "hsl(38,92%,50%)", title: `${homeworkCount} active assignment${homeworkCount > 1 ? "s" : ""}`, desc: "Check submissions", time: "Ongoing", isRead: true }] : []),
  ];

  const notifications = [...realItems, ...derivedItems];
  const totalBadge = unreadCount > 0 ? unreadCount : notifications.filter((n) => !n.isRead).length;

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
          border: "1px solid var(--border-glass)", background: isOpen ? "rgba(0,123,255,0.08)" : "transparent",
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
            {totalBadge > 0 && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", background: "rgba(0,123,255,0.08)", padding: "2px 8px", borderRadius: "10px" }}>{totalBadge} new</span>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                You're all caught up.
              </div>
            ) : notifications.map((notif) => (
              <div key={notif.id} style={{ display: "flex", gap: "12px", padding: "12px 18px", borderBottom: "1px solid var(--border-glass)", transition: "background 0.15s", cursor: "pointer", background: notif.isRead ? "transparent" : "rgba(0,123,255,0.03)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,123,255,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = notif.isRead ? "transparent" : "rgba(0,123,255,0.03)")}>
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
            <span onClick={markAllRead} style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", cursor: "pointer" }}>Mark all as read</span>
          </div>
        </div>
      )}
    </div>
  );
}
