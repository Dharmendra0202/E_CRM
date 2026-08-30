import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api";
import { inputStyle, labelStyle } from "../utils/styles";
import {
  User, Mail, Phone, MapPin, Calendar, GraduationCap, BookOpen,
  Save, Shield, Users2, Heart, Briefcase, CheckCircle2, Sparkles,
  Building2, Edit3, X,
} from "lucide-react";

export function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    // Student fields
    parentName: "", parentPhone: "", parentEmail: "",
    motherName: "", motherPhone: "", gender: "", address: "",
    // Teacher fields
    bio: "", qualification: "",
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.getProfile();
      if (res.data) {
        setProfile(res.data);
        setForm({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          phone: res.data.phone || "",
          parentName: res.data.student?.parentName || "",
          parentPhone: res.data.student?.parentPhone || "",
          parentEmail: res.data.student?.parentEmail || "",
          motherName: res.data.student?.motherName || "",
          motherPhone: res.data.student?.motherPhone || "",
          gender: res.data.student?.gender || "",
          address: res.data.student?.address || "",
          bio: res.data.teacher?.bio || "",
          qualification: res.data.teacher?.qualification || "",
        });
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const body: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      };
      if (profile?.role === "STUDENT" && profile?.student) {
        body.parentName = form.parentName;
        body.parentPhone = form.parentPhone;
        body.parentEmail = form.parentEmail;
        body.motherName = form.motherName;
        body.motherPhone = form.motherPhone;
        body.gender = form.gender;
        body.address = form.address;
      }
      if (profile?.role === "TEACHER" && profile?.teacher) {
        body.bio = form.bio;
        body.qualification = form.qualification;
      }
      const res = await api.auth.updateProfile(body);
      if (res.data) setProfile(res.data);
      setSuccessMsg("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        parentName: profile.student?.parentName || "",
        parentPhone: profile.student?.parentPhone || "",
        parentEmail: profile.student?.parentEmail || "",
        motherName: profile.student?.motherName || "",
        motherPhone: profile.student?.motherPhone || "",
        gender: profile.student?.gender || "",
        address: profile.student?.address || "",
        bio: profile.teacher?.bio || "",
        qualification: profile.teacher?.qualification || "",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      ADMIN: { bg: "hsla(271,91%,60%,0.1)", color: "hsl(271,91%,60%)", label: "Administrator" },
      SUPER_ADMIN: { bg: "hsla(271,91%,60%,0.1)", color: "hsl(271,91%,60%)", label: "Super Admin" },
      TEACHER: { bg: "hsla(199,89%,48%,0.1)", color: "hsl(199,89%,48%)", label: "Teacher" },
      STUDENT: { bg: "hsla(142,70%,42%,0.1)", color: "hsl(142,70%,42%)", label: "Student" },
      PARENT: { bg: "hsla(39,100%,50%,0.1)", color: "hsl(39,100%,50%)", label: "Parent" },
      STAFF: { bg: "hsla(328,100%,54%,0.1)", color: "hsl(328,100%,54%)", label: "Staff" },
      ACCOUNTANT: { bg: "hsla(199,89%,48%,0.1)", color: "hsl(199,89%,48%)", label: "Accountant" },
    };
    return map[role] || { bg: "hsla(0,0%,50%,0.1)", color: "hsl(0,0%,50%)", label: role };
  };

  const initials = profile ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() : "";
  const roleBadge = profile ? getRoleBadge(profile.role) : { bg: "", color: "", label: "" };

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid var(--border-glass)",
    padding: "24px",
    marginBottom: "16px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "10px",
    margin: "0 0 20px", fontSize: "15px", fontWeight: 700,
    color: "var(--text-primary)",
  };

  const iconBadgeStyle = (color: string): React.CSSProperties => ({
    width: "32px", height: "32px", borderRadius: "10px",
    background: color, display: "flex", alignItems: "center", justifyContent: "center",
  });

  const fieldGroupStyle: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
  };

  const readOnlyFieldStyle: React.CSSProperties = {
    ...inputStyle,
    background: "hsla(285,30%,96%,0.5)",
    color: "var(--text-secondary)",
    cursor: "not-allowed",
    border: "1px solid hsla(285,30%,80%,0.15)",
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Skeleton variant="rect" height={200} />
        <div style={{ marginTop: "16px" }}><Skeleton variant="rect" height={300} /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center", padding: "60px 20px" }}>
        <User size={48} style={{ color: "var(--text-secondary)", marginBottom: "12px" }} />
        <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>Profile Not Found</h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Unable to load your profile. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Success / Error Messages */}
      {successMsg && (
        <div style={{
          background: "hsla(142,70%,42%,0.08)", border: "1px solid hsla(142,70%,42%,0.2)",
          padding: "12px 16px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px",
          fontWeight: 600, color: "hsl(142,70%,42%)", display: "flex", alignItems: "center", gap: "8px",
          animation: "slideDown 0.3s ease-out",
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: "hsla(342,90%,48%,0.08)", border: "1px solid hsla(342,90%,48%,0.2)",
          padding: "12px 16px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px",
          fontWeight: 600, color: "hsl(342,90%,48%)", display: "flex", alignItems: "center", gap: "8px",
        }}>
          <X size={16} /> {errorMsg}
        </div>
      )}

      {/* ═══════ PROFILE HEADER CARD ═══════ */}
      <div style={{
        background: "linear-gradient(135deg, hsl(271,91%,60%) 0%, hsl(328,100%,54%) 50%, hsl(350,100%,64%) 100%)",
        borderRadius: "20px", padding: "32px", marginBottom: "20px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "hsla(0,0%,100%,0.08)" }} />
        <div style={{ position: "absolute", bottom: "-20px", left: "40%", width: "80px", height: "80px", borderRadius: "50%", background: "hsla(0,0%,100%,0.05)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative", zIndex: 1 }}>
          {/* Avatar */}
          <div style={{
            width: "80px", height: "80px", borderRadius: "20px",
            background: "hsla(0,0%,100%,0.2)", backdropFilter: "blur(10px)",
            border: "2px solid hsla(0,0%,100%,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: 800, color: "#fff",
            fontFamily: "var(--font-headings)",
            flexShrink: 0,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-headings)" }}>
              {profile.firstName} {profile.lastName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{
                fontSize: "11px", fontWeight: 700, color: "#fff",
                background: "hsla(0,0%,100%,0.2)", backdropFilter: "blur(10px)",
                padding: "4px 12px", borderRadius: "20px",
                border: "1px solid hsla(0,0%,100%,0.2)",
              }}>
                {roleBadge.label}
              </span>
              <span style={{ fontSize: "12px", color: "hsla(0,0%,100%,0.8)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Mail size={12} /> {profile.email}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
              {profile.phone && (
                <span style={{ fontSize: "12px", color: "hsla(0,0%,100%,0.75)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Phone size={12} /> {profile.phone}
                </span>
              )}
              <span style={{ fontSize: "12px", color: "hsla(0,0%,100%,0.75)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={12} /> Member since {new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              {profile.emailVerified && (
                <span style={{ fontSize: "11px", color: "#fff", display: "flex", alignItems: "center", gap: "3px" }}>
                  <CheckCircle2 size={12} /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Edit / Cancel button */}
          <div style={{ flexShrink: 0 }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "10px 18px", borderRadius: "12px",
                  background: "hsla(0,0%,100%,0.2)", backdropFilter: "blur(10px)",
                  border: "1px solid hsla(0,0%,100%,0.3)",
                  color: "#fff", fontSize: "12px", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "hsla(0,0%,100%,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "hsla(0,0%,100%,0.2)"; }}
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <button
                onClick={handleCancel}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "10px 18px", borderRadius: "12px",
                  background: "hsla(342,90%,48%,0.3)", backdropFilter: "blur(10px)",
                  border: "1px solid hsla(342,90%,48%,0.4)",
                  color: "#fff", fontSize: "12px", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Active Batches for students */}
        {profile.student?.enrollments?.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
            {profile.student.enrollments.map((e: any) => (
              <span key={e.id} style={{
                fontSize: "11px", fontWeight: 600, color: "#fff",
                background: "hsla(0,0%,100%,0.15)", backdropFilter: "blur(10px)",
                padding: "5px 12px", borderRadius: "20px",
                border: "1px solid hsla(0,0%,100%,0.15)",
              }}>
                <BookOpen size={10} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                {e.batch?.name} — {e.batch?.subject}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ PERSONAL INFORMATION ═══════ */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <div style={iconBadgeStyle("hsla(271,91%,60%,0.1)")}>
            <User size={16} style={{ color: "hsl(271,91%,60%)" }} />
          </div>
          Personal Information
        </div>
        <div style={fieldGroupStyle}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input
              style={isEditing ? inputStyle : readOnlyFieldStyle}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              readOnly={!isEditing}
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input
              style={isEditing ? inputStyle : readOnlyFieldStyle}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              readOnly={!isEditing}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input style={readOnlyFieldStyle} value={profile.email} readOnly />
            <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>Email cannot be changed</span>
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              style={isEditing ? inputStyle : readOnlyFieldStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              readOnly={!isEditing}
              placeholder={isEditing ? "Enter phone number" : "Not set"}
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <input style={readOnlyFieldStyle} value={roleBadge.label} readOnly />
          </div>
          <div>
            <label style={labelStyle}>Auth Provider</label>
            <input style={readOnlyFieldStyle} value={profile.authProvider === "google" ? "Google" : profile.authProvider === "local+google" ? "Email + Google" : "Email & Password"} readOnly />
          </div>
        </div>
      </div>

      {/* ═══════ STUDENT-SPECIFIC: PARENT/GUARDIAN ═══════ */}
      {profile.role === "STUDENT" && profile.student && (
        <>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <div style={iconBadgeStyle("hsla(328,100%,54%,0.1)")}>
                <Users2 size={16} style={{ color: "hsl(328,100%,54%)" }} />
              </div>
              Father / Guardian Details
            </div>
            <div style={fieldGroupStyle}>
              <div>
                <label style={labelStyle}>Father / Guardian Name</label>
                <input
                  style={isEditing ? inputStyle : readOnlyFieldStyle}
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label style={labelStyle}>Father / Guardian Phone</label>
                <input
                  style={isEditing ? inputStyle : readOnlyFieldStyle}
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  readOnly={!isEditing}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Father / Guardian Email</label>
                <input
                  style={isEditing ? inputStyle : readOnlyFieldStyle}
                  value={form.parentEmail}
                  onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                  readOnly={!isEditing}
                />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <div style={iconBadgeStyle("hsla(350,100%,64%,0.1)")}>
                <Heart size={16} style={{ color: "hsl(350,100%,64%)" }} />
              </div>
              Mother Details
            </div>
            <div style={fieldGroupStyle}>
              <div>
                <label style={labelStyle}>Mother Name</label>
                <input
                  style={isEditing ? inputStyle : readOnlyFieldStyle}
                  value={form.motherName}
                  onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "Enter mother's name" : "Not set"}
                />
              </div>
              <div>
                <label style={labelStyle}>Mother Phone</label>
                <input
                  style={isEditing ? inputStyle : readOnlyFieldStyle}
                  value={form.motherPhone}
                  onChange={(e) => setForm({ ...form, motherPhone: e.target.value })}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "Enter mother's phone" : "Not set"}
                />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <div style={iconBadgeStyle("hsla(199,89%,48%,0.1)")}>
                <MapPin size={16} style={{ color: "hsl(199,89%,48%)" }} />
              </div>
              Additional Information
            </div>
            <div style={fieldGroupStyle}>
              <div>
                <label style={labelStyle}>Gender</label>
                {isEditing ? (
                  <select style={inputStyle} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input style={readOnlyFieldStyle} value={form.gender || "Not set"} readOnly />
                )}
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input style={readOnlyFieldStyle} value={profile.student.dateOfBirth ? new Date(profile.student.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "Not set"} readOnly />
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>Contact admin to update DOB</span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <textarea
                  style={{ ...( isEditing ? inputStyle : readOnlyFieldStyle), minHeight: "70px", resize: "vertical" } as React.CSSProperties}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "Enter full address" : "Not set"}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════ TEACHER-SPECIFIC ═══════ */}
      {profile.role === "TEACHER" && profile.teacher && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <div style={iconBadgeStyle("hsla(199,89%,48%,0.1)")}>
              <GraduationCap size={16} style={{ color: "hsl(199,89%,48%)" }} />
            </div>
            Teaching Profile
          </div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>Qualification</label>
              <input
                style={isEditing ? inputStyle : readOnlyFieldStyle}
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label style={labelStyle}>Hourly Rate</label>
              <input style={readOnlyFieldStyle} value={`₹${profile.teacher.hourlyRate || 0}`} readOnly />
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>Managed by admin</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Bio</label>
              <textarea
                style={{ ...(isEditing ? inputStyle : readOnlyFieldStyle), minHeight: "80px", resize: "vertical" } as React.CSSProperties}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                readOnly={!isEditing}
                placeholder={isEditing ? "Tell us about your teaching experience..." : "Not set"}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ACCOUNT SECURITY INFO ═══════ */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <div style={iconBadgeStyle("hsla(142,70%,42%,0.1)")}>
            <Shield size={16} style={{ color: "hsl(142,70%,42%)" }} />
          </div>
          Account Security
        </div>
        <div style={fieldGroupStyle}>
          <div>
            <label style={labelStyle}>Email Verification</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: profile.emailVerified ? "hsla(142,70%,42%,0.06)" : "hsla(39,100%,50%,0.06)", borderRadius: "10px", border: `1px solid ${profile.emailVerified ? "hsla(142,70%,42%,0.15)" : "hsla(39,100%,50%,0.15)"}` }}>
              <CheckCircle2 size={14} style={{ color: profile.emailVerified ? "hsl(142,70%,42%)" : "hsl(39,100%,50%)" }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: profile.emailVerified ? "hsl(142,70%,42%)" : "hsl(39,100%,50%)" }}>
                {profile.emailVerified ? "Email Verified" : "Email Not Verified"}
              </span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Account Created</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
              <Calendar size={14} style={{ color: "var(--text-secondary)" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ SAVE BUTTON (visible when editing) ═══════ */}
      {isEditing && (
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: "12px",
          padding: "20px 0", position: "sticky", bottom: "0",
          background: "linear-gradient(to top, var(--bg-primary) 60%, transparent)",
          zIndex: 5,
        }}>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={saving} onClick={handleSave} leftIcon={<Save size={14} />}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
