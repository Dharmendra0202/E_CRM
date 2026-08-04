import React, { useState } from "react";
import { Button } from "./ui/Button";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  Building2, MapPin, CalendarDays, Layers, CheckCircle2,
  ArrowRight, ArrowLeft, Sparkles, Globe, Phone, Mail,
} from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, label: "Organization", icon: <Building2 size={18} /> },
  { id: 2, label: "Campus", icon: <MapPin size={18} /> },
  { id: 3, label: "Academic Year", icon: <CalendarDays size={18} /> },
  { id: 4, label: "Departments", icon: <Layers size={18} /> },
  { id: 5, label: "Complete", icon: <CheckCircle2 size={18} /> },
];

const ORG_TYPES = [
  { value: "SCHOOL", label: "School" },
  { value: "COACHING", label: "Coaching Institute" },
  { value: "COLLEGE", label: "College" },
  { value: "TRAINING_CENTER", label: "Training Center" },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Step 1: Organization Details
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("COACHING");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  const [orgPincode, setOrgPincode] = useState("");

  // Step 2: Campus
  const [campusName, setCampusName] = useState("Main Campus");
  const [campusAddress, setCampusAddress] = useState("");
  const [campusCity, setCampusCity] = useState("");
  const [campusPhone, setCampusPhone] = useState("");

  // Step 3: Academic Year
  const [ayName, setAyName] = useState("2026-27");
  const [ayStart, setAyStart] = useState("2026-04-01");
  const [ayEnd, setAyEnd] = useState("2027-03-31");

  // Step 4: Departments
  const [departments, setDepartments] = useState([
    { name: "Mathematics", code: "MATH" },
    { name: "Science", code: "SCI" },
  ]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");

  const handleNext = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      if (currentStep === 1) {
        if (!orgName.trim()) { setError("Organization name is required."); setIsSubmitting(false); return; }
        const res = await api.organizations.create({
          name: orgName, type: orgType, email: orgEmail, phone: orgPhone,
          website: orgWebsite, address: orgAddress, city: orgCity, state: orgState, pincode: orgPincode,
        });
        if (res.status === "success") { setOrgId(res.data.id); setCurrentStep(2); }
        else { setError(res.message || "Failed to create organization."); }
      } else if (currentStep === 2) {
        if (!orgId) return;
        await api.organizations.setup(orgId, 2, {
          campuses: [{ name: campusName || "Main Campus", address: campusAddress, city: campusCity, phone: campusPhone, isMain: true }],
        });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (!orgId) return;
        await api.organizations.setup(orgId, 3, {
          academicYear: { name: ayName, startDate: ayStart, endDate: ayEnd },
        });
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!orgId) return;
        await api.organizations.setup(orgId, 4, { departments });
        setCurrentStep(5);
      } else if (currentStep === 5) {
        if (!orgId) return;
        await api.organizations.setup(orgId, 5, {});
        onComplete();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
    setIsSubmitting(false);
  };

  const addDepartment = () => {
    if (!newDeptName.trim()) return;
    setDepartments([...departments, { name: newDeptName, code: newDeptCode || newDeptName.substring(0, 4).toUpperCase() }]);
    setNewDeptName("");
    setNewDeptCode("");
  };

  const removeDepartment = (idx: number) => {
    setDepartments(departments.filter((_, i) => i !== idx));
  };

  

  

  return (
    <div className="animate-fade-in" style={{ maxWidth: "720px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 8px 24px hsla(328,100%,54%,0.3)" }}>
          <Sparkles size={24} color="#fff" />
        </div>
        <h1 className="text-gradient-indigo" style={{ margin: "0 0 8px", fontSize: "28px" }}>Setup Your Organization</h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Complete these steps to configure your workspace.</p>
      </div>

      {/* Step Progress */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "32px" }}>
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px",
              background: currentStep === step.id ? "hsla(328,100%,54%,0.1)" : currentStep > step.id ? "hsla(142,70%,42%,0.08)" : "transparent",
              border: `1px solid ${currentStep === step.id ? "hsla(328,100%,54%,0.3)" : currentStep > step.id ? "hsla(142,70%,42%,0.2)" : "var(--border-glass)"}`,
              transition: "all 0.3s",
            }}>
              <span style={{ color: currentStep > step.id ? "var(--color-success)" : currentStep === step.id ? "var(--color-accent)" : "var(--text-secondary)", display: "flex" }}>
                {currentStep > step.id ? <CheckCircle2 size={16} /> : step.icon}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: currentStep === step.id ? "var(--color-accent)" : currentStep > step.id ? "var(--color-success)" : "var(--text-secondary)", display: idx > 2 ? "none" : undefined }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && <div style={{ width: "20px", height: "2px", background: currentStep > step.id ? "var(--color-success)" : "var(--border-glass)", borderRadius: "1px" }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content Card */}
      <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", border: "1px solid var(--border-glass)", boxShadow: "0 4px 24px rgba(29,10,39,0.06)" }}>
        {/* Step 1: Organization Details */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Organization Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Organization Name *</label>
                <input style={inputStyle} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. ABC Coaching Institute" />
              </div>
              <div>
                <label style={labelStyle}>Institute Type</label>
                <select style={inputStyle} value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                  {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="contact@institute.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input style={inputStyle} value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} placeholder="https://..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} placeholder="Street address" />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={orgCity} onChange={(e) => setOrgCity(e.target.value)} placeholder="City" />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={orgState} onChange={(e) => setOrgState(e.target.value)} placeholder="State" />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input style={inputStyle} value={orgPincode} onChange={(e) => setOrgPincode(e.target.value)} placeholder="110001" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Campus */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700 }}>Campus Setup</h2>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)" }}>Add your main campus. You can add more later.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Campus Name</label>
                <input style={inputStyle} value={campusName} onChange={(e) => setCampusName(e.target.value)} placeholder="Main Campus" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={campusAddress} onChange={(e) => setCampusAddress(e.target.value)} placeholder="Campus address" />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={campusCity} onChange={(e) => setCampusCity(e.target.value)} placeholder="City" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={campusPhone} onChange={(e) => setCampusPhone(e.target.value)} placeholder="Phone number" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Academic Year */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700 }}>Academic Year</h2>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)" }}>Set your current academic session.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Session Name</label>
                <input style={inputStyle} value={ayName} onChange={(e) => setAyName(e.target.value)} placeholder="2026-27" />
              </div>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input style={inputStyle} type="date" value={ayStart} onChange={(e) => setAyStart(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input style={inputStyle} type="date" value={ayEnd} onChange={(e) => setAyEnd(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Departments */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700 }}>Departments / Subjects</h2>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)" }}>Add departments or subject groups. You can customize later.</p>

            {/* Department List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {departments.map((dept, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "hsla(271,91%,60%,0.05)", borderRadius: "10px", border: "1px solid hsla(271,91%,60%,0.12)" }}>
                  <Layers size={14} style={{ color: "hsl(271,91%,60%)" }} />
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>{dept.name}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "6px" }}>{dept.code}</span>
                  <button onClick={() => removeDepartment(idx)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>

            {/* Add New */}
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Department Name</label>
                <input style={inputStyle} value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. English" onKeyDown={(e) => e.key === "Enter" && addDepartment()} />
              </div>
              <div style={{ width: "100px" }}>
                <label style={labelStyle}>Code</label>
                <input style={inputStyle} value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} placeholder="ENG" />
              </div>
              <Button variant="secondary" onClick={addDepartment} style={{ height: "42px" }}>Add</Button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === 5 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "hsla(142,70%,42%,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <CheckCircle2 size={36} style={{ color: "var(--color-success)" }} />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 800 }}>All Set!</h2>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--text-secondary)", maxWidth: "360px", marginLeft: "auto", marginRight: "auto" }}>
              Your organization workspace is ready. You can now start adding students, staff, and manage your institution.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
              {[
                { label: `Organization: ${orgName}`, color: "hsl(328,100%,54%)" },
                { label: `Campus: ${campusName}`, color: "hsl(271,91%,60%)" },
                { label: `Session: ${ayName}`, color: "hsl(142,70%,42%)" },
                { label: `${departments.length} Departments`, color: "hsl(38,92%,50%)" },
              ].map((item, i) => (
                <span key={i} style={{ fontSize: "11px", fontWeight: 700, color: item.color, background: `${item.color}10`, border: `1px solid ${item.color}20`, padding: "5px 12px", borderRadius: "20px" }}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: "16px", padding: "10px 14px", background: "hsla(342,90%,48%,0.07)", border: "1px solid hsla(342,90%,48%,0.15)", borderRadius: "10px", fontSize: "12px", fontWeight: 600, color: "var(--color-danger)" }}>
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border-glass)" }}>
          {currentStep > 1 && currentStep < 5 ? (
            <button onClick={() => setCurrentStep(currentStep - 1)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <ArrowLeft size={14} /> Back
            </button>
          ) : <div />}

          <Button variant="primary" isLoading={isSubmitting} onClick={handleNext} rightIcon={currentStep < 5 ? <ArrowRight size={14} /> : <CheckCircle2 size={14} />}>
            {currentStep === 5 ? "Go to Dashboard" : currentStep === 1 ? "Create & Continue" : "Save & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
