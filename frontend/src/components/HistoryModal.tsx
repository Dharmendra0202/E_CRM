import React, { useState, useEffect } from "react";
import type { HistoryItem } from "../utils/history";
import { getHistoryList, clearHistoryList } from "../utils/history";
import { X, Search, Clock, PlusCircle, Edit3, Trash2, CalendarDays, User, Sparkles, Filter, Trash } from "lucide-react";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const loadItems = () => {
    setItems(getHistoryList());
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadItems();
    window.addEventListener("ecrm_history_updated", handleUpdate);
    return () => window.removeEventListener("ecrm_history_updated", handleUpdate);
  }, []);

  if (!isOpen) return null;

  const categories = ["ALL", "Class Schedule", "Student", "Staff", "Attendance"];

  const filtered = items.filter(item => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.user && item.user.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const getActionIcon = (action: HistoryItem["action"]) => {
    switch (action) {
      case "Created":
        return <PlusCircle size={15} style={{ color: "#10b981" }} />;
      case "Updated":
        return <Edit3 size={15} style={{ color: "#3b82f6" }} />;
      case "Deleted":
        return <Trash2 size={15} style={{ color: "#ef4444" }} />;
      default:
        return <Clock size={15} style={{ color: "#8b5cf6" }} />;
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 16px 80px 16px"
    }}>
      <div style={{
        background: "#ffffff", borderRadius: "24px", width: "100%", maxWidth: "640px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        display: "flex", flexDirection: "column", maxHeight: "85vh", overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #31104b 100%)",
          color: "#ffffff", padding: "20px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "12px",
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Clock size={20} style={{ color: "#fbbf24" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
                Creation & Activity History
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                View history log of all classes, students, and updates you created
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
              borderRadius: "10px", width: "32px", height: "32px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{
          padding: "16px 24px 12px 24px", background: "hsl(320,20%,98%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "12px"
        }}>
          {/* Search Box */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#ffffff", border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "12px", padding: "8px 14px"
          }}>
            <Search size={16} style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              placeholder="Search history by class name, subject, student, room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: "13px", fontWeight: 600, width: "100%", color: "var(--text-primary)"
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                <X size={14} style={{ color: "var(--text-secondary)" }} />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", scrollbarWidth: "none" }}>
            <Filter size={13} style={{ color: "var(--text-secondary)", flexShrink: 0, marginRight: "4px" }} />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "5px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 700,
                  border: selectedCategory === cat ? "none" : "1px solid rgba(0,0,0,0.08)",
                  background: selectedCategory === cat ? "linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%))" : "#ffffff",
                  color: selectedCategory === cat ? "#ffffff" : "var(--text-primary)",
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s"
                }}
              >
                {cat === "ALL" ? `All Items (${items.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        {/* History Item Timeline List */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px 24px",
          display: "flex", flexDirection: "column", gap: "10px"
        }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "10px"
            }}>
              <Clock size={32} style={{ opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>No history logs found</p>
              <span style={{ fontSize: "12px" }}>Any classes or items you schedule or modify will appear here automatically.</span>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "16px", padding: "14px 16px",
                  display: "flex", alignItems: "flex-start", gap: "14px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "transform 0.15s, boxShadow 0.15s"
                }}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: item.badgeColor ? `${item.badgeColor}15` : "rgba(139,92,246,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  marginTop: "2px"
                }}>
                  {getActionIcon(item.action)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 800, textTransform: "uppercase",
                      color: item.badgeColor || "hsl(271,91%,60%)",
                      background: item.badgeColor ? `${item.badgeColor}15` : "rgba(139,92,246,0.1)",
                      padding: "2px 8px", borderRadius: "10px"
                    }}>
                      {item.category} · {item.action}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {item.details}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px", background: "hsl(320,20%,98%)",
          borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
            Total {items.length} activity log entries recorded
          </span>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Clear all creation history logs?")) clearHistoryList();
              }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "transparent", border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444", borderRadius: "10px", padding: "6px 12px",
                fontSize: "11px", fontWeight: 700, cursor: "pointer"
              }}
            >
              <Trash size={12} /> Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
