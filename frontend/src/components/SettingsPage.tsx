import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  Settings, Building2, Globe, Calendar, Layers, Shield,
  Save, Plus, Trash2, Sun, Moon, Bell, Mail, CreditCard,
} from "lucide-react";

type SettingsTab = "profile" | "academic" | "departments" | "preferences";

export function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [org, setOrg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Profile form
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", website: "", address: "", city: "", state: "", pincode: "", timezone: "Asia/Kolkata", currency: "INR", language: "en" });

  // Departments
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");

  // Academic Years
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [newAY, setNewAY] = useState({ name: "", startDate: "", endDate: "" });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.settings.get();
      if (res.data?.organization) {
        const o = res.data.organization;
        setOrg(o);
        setProfile({ name: o.name || "", email: o.email || "", phone: o.phone || "", website: o.website || "", address: o.address || "", city: o.city || "", state: o.state || "", pincode: o.pincode || "", timezone: o.timezone || "Asia/Kolkata", currency: o.currency || "INR", language: o.language || "en" });
        setDepartments(o.departments || []);
        setAcademicYears(o.academicYears || []);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.settings.updateOrganization(profile);
      setSuccessMsg("Settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      await api.settings.addDepartment({ name: newDeptName, code: newDeptCode });
      setNewDeptName(""); setNewDeptCode("");
      loadSettings();
    } catch (err) { console.error(err); }
  };

  const handleDeleteDepartment = async (id: string) => {
    try { await api.settings.deleteDepartment(id); loadSettings(); } catch (err) { console.error(err); }
  };

  const handleAddAcademicYear = async () => {
    if (!newAY.name || !newAY.startDate || !newAY.endDate) return;
    try {
      await api.settings.addAcademicYear({ ...newAY, isCurrent: true });
      setNewAY({ name: "", startDate: "", endDate: "" });
      loadSettings();
    } catch (err) { console.error(err); }
  };

  
  

  const tabs = [
    { key: "profile" as SettingsTab, label: "Organization", icon: <Building2 size={14} /> },
    { key: "academic" as SettingsTab, label: "Academic Year", icon: <Calendar size={14} /> },
    { key: "departments" as SettingsTab, label: "Departments", icon: <Layers size={14} /> },
    { key: "preferences" as SettingsTab, label: "Preferences", icon: <Globe size={14} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Settings</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Configure your organization, academic year, and preferences.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: "hsla(142,70%,42%,0.08)", border: "1px solid hsla(142,70%,42%,0.2)", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", fontWeight: 600, color: "var(--color-success)" }}>{successMsg}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px" }}>
        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, textAlign: "left", transition: "all 0.2s", background: activeTab === tab.key ? "hsla(328,100%,54%,0.08)" : "transparent", color: activeTab === tab.key ? "var(--color-accent)" : "var(--text-secondary)" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={50} />)}</div>
          ) : (
            <>
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>Organization Profile</h3>
                  {!org ? (
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No organization set up. Go to Onboarding to create one.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Organization Name</label><input style={inputStyle} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
                      <div><label style={labelStyle}>Email</label><input style={inputStyle} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
                      <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
                      <div><label style={labelStyle}>Website</label><input style={inputStyle} value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} /></div>
                      <div><label style={labelStyle}>City</label><input style={inputStyle} value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
                      <div><label style={labelStyle}>State</label><input style={inputStyle} value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} /></div>
                      <div><label style={labelStyle}>Pincode</label><input style={inputStyle} value={profile.pincode} onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} /></div>
                      <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                        <Button variant="primary" isLoading={saving} onClick={handleSaveProfile} leftIcon={<Save size={14} />}>Save Changes</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACADEMIC YEAR TAB */}
              {activeTab === "academic" && (
                <div>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>Academic Years</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {academicYears.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No academic years configured.</p>
                    ) : academicYears.map((ay) => (
                      <div key={ay.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: ay.isCurrent ? "hsla(142,70%,42%,0.06)" : "var(--bg-secondary)", borderRadius: "10px", border: `1px solid ${ay.isCurrent ? "hsla(142,70%,42%,0.2)" : "var(--border-glass)"}` }}>
                        <Calendar size={14} style={{ color: ay.isCurrent ? "var(--color-success)" : "var(--text-secondary)" }} />
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: 700 }}>{ay.name}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{new Date(ay.startDate).toLocaleDateString("en-IN")} — {new Date(ay.endDate).toLocaleDateString("en-IN")}</span>
                        {ay.isCurrent && <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,42%,0.1)", padding: "2px 8px", borderRadius: "8px" }}>CURRENT</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ width: "120px" }}><label style={labelStyle}>Name</label><input style={inputStyle} value={newAY.name} onChange={(e) => setNewAY({ ...newAY, name: e.target.value })} placeholder="2026-27" /></div>
                    <div><label style={labelStyle}>Start</label><input style={inputStyle} type="date" value={newAY.startDate} onChange={(e) => setNewAY({ ...newAY, startDate: e.target.value })} /></div>
                    <div><label style={labelStyle}>End</label><input style={inputStyle} type="date" value={newAY.endDate} onChange={(e) => setNewAY({ ...newAY, endDate: e.target.value })} /></div>
                    <Button variant="secondary" onClick={handleAddAcademicYear} leftIcon={<Plus size={13} />}>Add</Button>
                  </div>
                </div>
              )}

              {/* DEPARTMENTS TAB */}
              {activeTab === "departments" && (
                <div>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>Departments</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                    {departments.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No departments configured.</p>
                    ) : departments.map((dept) => (
                      <div key={dept.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                        <Layers size={14} style={{ color: "hsl(271,91%,60%)" }} />
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>{dept.name}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{dept.code || "—"}</span>
                        <button onClick={() => handleDeleteDepartment(dept.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)", opacity: 0.5 }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}><label style={labelStyle}>Department Name</label><input style={inputStyle} value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. Science" /></div>
                    <div style={{ width: "100px" }}><label style={labelStyle}>Code</label><input style={inputStyle} value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} placeholder="SCI" /></div>
                    <Button variant="secondary" onClick={handleAddDepartment} leftIcon={<Plus size={13} />}>Add</Button>
                  </div>
                </div>
              )}

              {/* PREFERENCES TAB */}
              {activeTab === "preferences" && (
                <div>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>Preferences</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>Timezone</label>
                      <select style={inputStyle} value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        <option value="America/New_York">America/New York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Currency</label>
                      <select style={inputStyle} value={profile.currency} onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="AED">AED (د.إ)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Language</label>
                      <select style={inputStyle} value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: "20px" }}>
                    <Button variant="primary" isLoading={saving} onClick={handleSaveProfile} leftIcon={<Save size={14} />}>Save Preferences</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
