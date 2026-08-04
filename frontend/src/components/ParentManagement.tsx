import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  Users2, Search, Phone, Mail, User, ChevronRight, GraduationCap,
  IndianRupee, Activity, Calendar,
} from "lucide-react";

export function ParentManagement() {
  const [parents, setParents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParent, setSelectedParent] = useState<any>(null);

  useEffect(() => { loadParents(); }, []);

  const loadParents = async () => {
    setIsLoading(true);
    try {
      const res = await api.students.getAll();
      if (res.data) {
        // Group students by parent info
        const parentMap = new Map<string, any>();
        for (const s of res.data) {
          const key = s.parentEmail || s.parentPhone;
          if (!key) continue;
          if (!parentMap.has(key)) {
            parentMap.set(key, {
              id: key,
              name: s.parentName,
              phone: s.parentPhone,
              email: s.parentEmail,
              children: [],
            });
          }
          parentMap.get(key).children.push({
            id: s.id,
            name: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.parentName,
            email: s.user?.email,
            batch: s.enrollments?.[0]?.batch?.name || "Not enrolled",
            status: s.enrollments?.[0]?.status || "—",
          });
        }
        setParents(Array.from(parentMap.values()));
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const filtered = parents.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery)
  );

  

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Parent Directory</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>View parent/guardian contacts and their linked children.</p>
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "hsl(271,91%,60%)", background: "hsla(271,91%,60%,0.08)", padding: "6px 14px", borderRadius: "20px" }}>
          {parents.length} Parents
        </span>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px", position: "relative", maxWidth: "360px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
        <input style={{ ...inputStyle, paddingLeft: "36px" }} placeholder="Search parents by name, email, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* Parent Cards */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rect" height={120} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
          <Users2 size={36} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
            {searchQuery ? "No parents match your search." : "No parent data available yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
          {filtered.map((parent) => (
            <div key={parent.id} onClick={() => setSelectedParent(selectedParent?.id === parent.id ? null : parent)}
              style={{
                background: "#fff", borderRadius: "16px", padding: "18px", border: `1px solid ${selectedParent?.id === parent.id ? "hsla(328,100%,54%,0.3)" : "var(--border-glass)"}`,
                boxShadow: "0 2px 12px rgba(29,10,39,0.04)", cursor: "pointer", transition: "all 0.25s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(29,10,39,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(29,10,39,0.04)"; }}
            >
              {/* Parent Info */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "hsla(271,91%,60%,0.1)", border: "2px solid hsla(271,91%,60%,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "hsl(271,91%,60%)" }}>
                  {parent.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{parent.name}</p>
                  <div style={{ display: "flex", gap: "12px", marginTop: "2px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}><Phone size={10} /> {parent.phone}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}><Mail size={10} /> {parent.email}</span>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.08)", padding: "3px 10px", borderRadius: "16px" }}>
                  {parent.children.length} child{parent.children.length > 1 ? "ren" : ""}
                </span>
              </div>

              {/* Children List */}
              {selectedParent?.id === parent.id && (
                <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Linked Children</p>
                  {parent.children.map((child: any) => (
                    <div key={child.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                      <GraduationCap size={14} style={{ color: "hsl(271,91%,60%)" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: 600 }}>{child.name}</p>
                        <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>{child.batch}</p>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: child.status === "ACTIVE" ? "var(--color-success)" : "var(--text-secondary)", background: child.status === "ACTIVE" ? "hsla(142,70%,42%,0.08)" : "var(--bg-secondary)", padding: "2px 8px", borderRadius: "10px" }}>
                        {child.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
