import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  Users2, Shield, Plus, Search, Mail, UserCheck, UserX,
  Edit3, Trash2, ChevronDown, CheckCircle2, XCircle, Clock,
  ArrowUpRight, ShieldCheck, Lock, Unlock,
} from "lucide-react";

export function UserRoleManagement() {
  const [activeTab, setActiveTab] = useState<"members" | "roles">("members");
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("teacher");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  // Role create modal
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleSlug, setNewRoleSlug] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [createRoleLoading, setCreateRoleLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, rolesRes] = await Promise.all([
        api.roles.getMembers(),
        api.roles.getAll(),
      ]);
      if (membersRes.data) setMembers(membersRes.data);
      if (rolesRes.data) setRoles(rolesRes.data);
    } catch (err) {
      console.error("Failed to load role data:", err);
    }
    setIsLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteMsg("");
    try {
      // We need an org ID - for now use the first org or skip
      const orgsRes = await api.organizations.getAll();
      const orgId = orgsRes.data?.[0]?.id;
      if (!orgId) {
        setInviteMsg("No organization found. Complete onboarding first.");
        setInviteLoading(false);
        return;
      }
      const res = await api.organizations.invite(orgId, inviteEmail, inviteRole);
      if (res.status === "success") {
        setInviteMsg("Invitation sent successfully!");
        setInviteEmail("");
        setTimeout(() => { setShowInvite(false); setInviteMsg(""); }, 2000);
        loadData();
      } else {
        setInviteMsg(res.message || "Failed to invite.");
      }
    } catch (err: any) {
      setInviteMsg(err.message || "Failed to invite user.");
    }
    setInviteLoading(false);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setCreateRoleLoading(true);
    try {
      const orgsRes = await api.organizations.getAll();
      const orgId = orgsRes.data?.[0]?.id;
      const slug = newRoleSlug || newRoleName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      await api.roles.create({ org_id: orgId, name: newRoleName, slug, description: newRoleDesc });
      setNewRoleName(""); setNewRoleSlug(""); setNewRoleDesc("");
      setShowCreateRole(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
    setCreateRoleLoading(false);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Delete this role? Members will need reassignment.")) return;
    try {
      await api.roles.delete(roleId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMemberStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await api.roles.updateMember(memberId, { status: newStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusMeta: Record<string, { color: string; bg: string; icon: any }> = {
    ACTIVE: { color: "var(--color-success)", bg: "hsla(142,70%,42%,0.08)", icon: <CheckCircle2 size={12} /> },
    INVITED: { color: "hsl(38,92%,50%)", bg: "hsla(38,92%,50%,0.08)", icon: <Clock size={12} /> },
    DISABLED: { color: "var(--color-danger)", bg: "hsla(342,90%,48%,0.08)", icon: <XCircle size={12} /> },
  };

  

  

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Users & Roles</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Manage team members, roles, and permissions.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="secondary" onClick={() => setShowCreateRole(true)} leftIcon={<Shield size={14} />}>New Role</Button>
          <Button variant="primary" onClick={() => setShowInvite(true)} leftIcon={<Plus size={14} />}>Invite User</Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "var(--bg-secondary)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
        {([{ key: "members", label: "Members", icon: <Users2 size={14} /> }, { key: "roles", label: "Roles & Permissions", icon: <Shield size={14} /> }] as const).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "9px",
              border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, transition: "all 0.2s",
              background: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "var(--color-accent)" : "var(--text-secondary)",
              boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ MEMBERS TAB ═══ */}
      {activeTab === "members" && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: "16px", position: "relative", maxWidth: "320px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input
              style={{ ...inputStyle, paddingLeft: "36px" }}
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Members Table */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden", boxShadow: "0 2px 12px rgba(29,10,39,0.05)" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px 100px", padding: "12px 20px", background: "rgba(29,10,39,0.02)", borderBottom: "1px solid var(--border-glass)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <div>User</div><div>Role</div><div>Status</div><div>Actions</div>
            </div>

            {isLoading ? (
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rect" height={52} />)}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center" }}>
                <Users2 size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {searchQuery ? "No members match your search." : "No members yet. Invite someone to get started."}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const st = statusMeta[member.status] || statusMeta.ACTIVE;
                return (
                  <div key={member.id} style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px 100px", padding: "14px 20px", borderBottom: "1px solid var(--border-glass)", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "hsla(271,91%,60%,0.1)", border: "1.5px solid hsla(271,91%,60%,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "hsl(271,91%,60%)" }}>
                        {member.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{member.name}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{member.email}</p>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "hsl(271,91%,60%)", background: "hsla(271,91%,60%,0.08)", padding: "3px 10px", borderRadius: "20px" }}>
                        {member.role}
                      </span>
                    </div>
                    <div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: st.color, background: st.bg, padding: "3px 10px", borderRadius: "20px" }}>
                        {st.icon} {member.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handleToggleMemberStatus(member.id, member.status)}
                        title={member.status === "ACTIVE" ? "Disable" : "Enable"}
                        style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", transition: "all 0.2s" }}
                      >
                        {member.status === "ACTIVE" ? <Lock size={13} /> : <Unlock size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══ ROLES TAB ═══ */}
      {activeTab === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-glass)" }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rect" height={32} />
              </div>
            ))
          ) : roles.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: "48px 20px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
              <Shield size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>No roles configured. Create your first role to get started.</p>
            </div>
          ) : (
            roles.map((role) => (
              <div key={role.id} style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-glass)", boxShadow: "0 2px 12px rgba(29,10,39,0.04)", transition: "all 0.25s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(29,10,39,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(29,10,39,0.04)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: role.isSystem ? "hsla(328,100%,54%,0.1)" : "hsla(200,95%,50%,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShieldCheck size={18} style={{ color: role.isSystem ? "var(--color-accent)" : "var(--color-info)" }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{role.name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{role.slug}</p>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <button onClick={() => handleDeleteRole(role.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", opacity: 0.6, transition: "opacity 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {role.description && <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-secondary)" }}>{role.description}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
                    {role.memberCount} member{role.memberCount !== 1 ? "s" : ""}
                  </span>
                  {role.isSystem && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-accent)", background: "hsla(328,100%,54%,0.08)", padding: "2px 8px", borderRadius: "10px" }}>SYSTEM</span>
                  )}
                  {role.permissions?.length > 0 && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "hsl(271,91%,60%)", background: "hsla(271,91%,60%,0.08)", padding: "2px 8px", borderRadius: "10px" }}>
                      {role.permissions.length} permissions
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ INVITE MODAL ═══ */}
      {showInvite && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowInvite(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Invite User</h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Assign Role</label>
              <select style={inputStyle} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {roles.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                {roles.length === 0 && <option value="teacher">Teacher</option>}
              </select>
            </div>
            {inviteMsg && (
              <p style={{ fontSize: "12px", fontWeight: 600, color: inviteMsg.includes("success") ? "var(--color-success)" : "var(--color-danger)", marginBottom: "12px" }}>{inviteMsg}</p>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button variant="primary" isLoading={inviteLoading} onClick={handleInvite} leftIcon={<Mail size={14} />}>Send Invite</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE ROLE MODAL ═══ */}
      {showCreateRole && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowCreateRole(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Create Role</h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Role Name</label>
              <input style={inputStyle} value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Lab Assistant" />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Slug (auto-generated)</label>
              <input style={inputStyle} value={newRoleSlug || newRoleName.toLowerCase().replace(/[^a-z0-9]+/g, "_")} onChange={(e) => setNewRoleSlug(e.target.value)} placeholder="lab_assistant" />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="What can this role do?" />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setShowCreateRole(false)}>Cancel</Button>
              <Button variant="primary" isLoading={createRoleLoading} onClick={handleCreateRole} leftIcon={<Shield size={14} />}>Create Role</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
