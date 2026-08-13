import React, { useState } from "react";
import {
  UserPlus, Users2, GraduationCap, Briefcase, ChevronRight, ChevronLeft,
  Check, User, Phone, Mail, MapPin, Calendar, IndianRupee, Shield,
} from "lucide-react";
import { api } from "../utils/api";

// ─────────────────────────── Types ───────────────────────────
type RoleType = "student" | "staff" | "teacher" | "";
type PaymentPlan = "single" | "2-installments" | "4-installments" | "custom";
type Step = 1 | 2 | 3 | 4;

interface PersonalDetails {
  firstName: string;
  lastName: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  email: string;
  address: string;
  batch: string;
}

interface GuardianDetails {
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
}

interface FeeDetails {
  totalAmount: string;
  paymentPlan: PaymentPlan;
  customInstallments: string;
  notes: string;
}

// ─────────────────────────── Component ───────────────────────────
export const NewEnrollment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [role, setRole] = useState<RoleType>("");
  const [personal, setPersonal] = useState<PersonalDetails>({
    firstName: "", lastName: "", phone: "", gender: "Male", dob: "", email: "", address: "", batch: "",
  });
  const [guardian, setGuardian] = useState<GuardianDetails>({
    fatherName: "", fatherPhone: "", motherName: "", motherPhone: "",
  });
  const [fee, setFee] = useState<FeeDetails>({
    totalAmount: "", paymentPlan: "single", customInstallments: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ─────────── Validation ───────────
  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !role) {
      newErrors.role = "Please select a role";
    }

    if (step === 2) {
      if (!personal.firstName.trim()) newErrors.firstName = "First name is required";
      if (!personal.phone.trim()) newErrors.phone = "Phone number is required";
      else if (!/^\d{10}$/.test(personal.phone.trim())) newErrors.phone = "Enter valid 10-digit number";
      if (!personal.gender) newErrors.gender = "Gender is required";
      if (!personal.dob) newErrors.dob = "Date of birth is required";
      else {
        const dobDate = new Date(personal.dob);
        const now = new Date();
        const minDate = new Date("1990-01-01");
        if (isNaN(dobDate.getTime()) || dobDate > now || dobDate < minDate) {
          newErrors.dob = "Enter a valid date between 1990 and today";
        }
      }
      if (personal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) newErrors.email = "Enter valid email";
      if (!personal.batch) newErrors.batch = "Please select a class/batch";
    }

    if (step === 3 && role === "student") {
      if (!guardian.fatherName.trim()) newErrors.fatherName = "Father's name is required";
      if (!guardian.fatherPhone.trim()) newErrors.fatherPhone = "Father's phone is required";
      else if (!/^\d{10}$/.test(guardian.fatherPhone.trim())) newErrors.fatherPhone = "Enter valid 10-digit number";
    }

    if (step === 4 && role === "student") {
      if (!fee.totalAmount.trim()) newErrors.totalAmount = "Fee amount is required";
      else if (isNaN(Number(fee.totalAmount))) newErrors.totalAmount = "Enter a valid amount";
      else if (Number(fee.totalAmount) > 9999999) newErrors.totalAmount = "Maximum fee amount is ₹99,99,999";
      if (fee.paymentPlan === "custom" && !fee.customInstallments.trim()) {
        newErrors.customInstallments = "Enter number of installments";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 2 && role !== "student") {
      handleSubmit();
      return;
    }
    setCurrentStep((currentStep + 1) as Step);
  };

  const prevStep = () => {
    setCurrentStep((currentStep - 1) as Step);
  };

  const handleSubmit = async () => {
    if (role === "student" && !validateStep(4)) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (role === "student") {
        const totalFee = Number(fee.totalAmount) || 0;

        await api.students.create({
          firstName: personal.firstName,
          lastName: personal.lastName || "",
          email: personal.email || `${personal.phone}@placeholder.com`,
          phone: personal.phone,
          parentName: guardian.fatherName,
          parentPhone: guardian.fatherPhone,
          parentEmail: personal.email || `${personal.phone}@placeholder.com`,
          dateOfBirth: personal.dob,
          feeAmount: String(totalFee),
          batch: personal.batch,
          motherName: guardian.motherName || "",
          motherPhone: guardian.motherPhone || "",
        });
      } else {
        await api.staff.create({
          email: personal.email || `${personal.phone}@placeholder.com`,
          password: "Staff@123",
          firstName: personal.firstName,
          lastName: personal.lastName || personal.firstName,
          role: role === "teacher" ? "TEACHER" : "SUPPORT",
          phone: personal.phone,
          ...(role === "teacher" ? { qualification: "General", hourlyRate: "0" } : {}),
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit enrollment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setRole("");
    setPersonal({ firstName: "", lastName: "", phone: "", gender: "Male", dob: "", email: "", address: "" });
    setGuardian({ fatherName: "", fatherPhone: "", motherName: "", motherPhone: "" });
    setFee({ totalAmount: "", paymentPlan: "single", customInstallments: "", notes: "" });
    setErrors({});
    setSubmitted(false);
    setSubmitError("");
  };

  // ─────────── Steps config ───────────
  const steps = [
    { num: 1, label: "Role" },
    { num: 2, label: "Personal Info" },
    ...(role === "student" ? [{ num: 3, label: "Guardian" }] : []),
    { num: 4, label: "Fee Structure" },
  ];

  // ─────────── Success State ───────────
  if (submitted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "24px" }}>
        <div style={{
          background: "#fff", borderRadius: "24px", padding: "48px", textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)", border: "1px solid hsla(285,30%,20%,0.06)",
          maxWidth: "440px", width: "100%",
        }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%", margin: "0 auto 20px",
            background: "linear-gradient(135deg, hsl(142,70%,45%), hsl(160,80%,40%))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Check size={36} color="#fff" />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", color: "hsl(285,50%,12%)" }}>
            Enrollment Successful!
          </h2>
          <p style={{ fontSize: "14px", color: "hsl(285,20%,50%)", margin: "0 0 24px" }}>
            {personal.firstName} {personal.lastName} has been enrolled as a <strong>{role}</strong>.
          </p>
          <button
            onClick={resetForm}
            style={{
              padding: "12px 28px", borderRadius: "12px", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, hsl(271,91%,60%), hsl(328,100%,54%))",
              color: "#fff", fontSize: "14px", fontWeight: 700, transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Enroll Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px", color: "hsl(285,50%,12%)" }}>
          New Enrollment
        </h1>
        <p style={{ fontSize: "14px", color: "hsl(285,20%,50%)", margin: 0 }}>
          Add a new student, staff member, or teacher to the system
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "32px" }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700,
                background: currentStep >= step.num
                  ? "linear-gradient(135deg, hsl(271,91%,60%), hsl(328,100%,54%))"
                  : "hsla(285,30%,20%,0.06)",
                color: currentStep >= step.num ? "#fff" : "hsl(285,20%,50%)",
                transition: "all 0.3s ease",
              }}>
                {currentStep > step.num ? <Check size={14} /> : step.num}
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 600,
                color: currentStep >= step.num ? "hsl(285,50%,12%)" : "hsl(285,20%,55%)",
              }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1, height: "2px", borderRadius: "1px", margin: "0 8px",
                background: currentStep > step.num
                  ? "linear-gradient(90deg, hsl(271,91%,60%), hsl(328,100%,54%))"
                  : "hsla(285,30%,20%,0.1)",
                transition: "background 0.3s ease",
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Card */}
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "32px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.06)", border: "1px solid hsla(285,30%,20%,0.06)",
      }}>
        {/* ═══════════ STEP 1: Role Selection ═══════════ */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "hsl(285,50%,12%)" }}>
              I am enrolling a...
            </h3>
            <p style={{ fontSize: "13px", color: "hsl(285,20%,50%)", margin: "0 0 24px" }}>
              Select the type of person you are adding
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {([
                { key: "student" as RoleType, icon: <GraduationCap size={28} />, label: "Student", desc: "Enroll a new learner" },
                { key: "staff" as RoleType, icon: <Briefcase size={28} />, label: "Staff", desc: "Add support staff" },
                { key: "teacher" as RoleType, icon: <Shield size={28} />, label: "Teacher", desc: "Add an instructor" },
              ]).map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setRole(item.key); setErrors({}); setCurrentStep(2); }}
                  style={{
                    padding: "24px 16px", borderRadius: "16px", border: "2px solid",
                    borderColor: role === item.key ? "hsl(271,91%,60%)" : "hsla(285,30%,20%,0.08)",
                    background: role === item.key ? "hsla(271,91%,60%,0.04)" : "#fff",
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                  }}
                  onMouseEnter={(e) => {
                    if (role !== item.key) e.currentTarget.style.borderColor = "hsla(271,91%,60%,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    if (role !== item.key) e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.08)";
                  }}
                >
                  <div style={{ color: role === item.key ? "hsl(271,91%,60%)" : "hsl(285,20%,50%)", transition: "color 0.2s" }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "hsl(285,50%,12%)" }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "hsl(285,20%,55%)" }}>
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
            {errors.role && (
              <p style={{ color: "hsl(0,70%,50%)", fontSize: "12px", marginTop: "12px" }}>{errors.role}</p>
            )}
          </div>
        )}

        {/* ═══════════ STEP 2: Personal Details ═══════════ */}
        {currentStep === 2 && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "hsl(285,50%,12%)" }}>
              Personal Information
            </h3>
            <p style={{ fontSize: "13px", color: "hsl(285,20%,50%)", margin: "0 0 24px" }}>
              Enter the {role}'s basic details
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <InputField
                label="First Name *"
                icon={<User size={15} />}
                value={personal.firstName}
                onChange={(v) => setPersonal({ ...personal, firstName: v.replace(/[^a-zA-Z\s]/g, "") })}
                error={errors.firstName}
                placeholder="Enter first name"
              />
              <InputField
                label="Last Name"
                icon={<User size={15} />}
                value={personal.lastName}
                onChange={(v) => setPersonal({ ...personal, lastName: v.replace(/[^a-zA-Z\s]/g, "") })}
                placeholder="Enter last name"
              />
              <InputField
                label="Phone Number *"
                icon={<Phone size={15} />}
                value={personal.phone}
                onChange={(v) => setPersonal({ ...personal, phone: v.replace(/\D/g, "").slice(0, 10) })}
                error={errors.phone}
                placeholder="10-digit phone number"
                type="tel"
              />
              <SelectField
                label="Gender *"
                value={personal.gender}
                options={["Male", "Female", "Other"]}
                onChange={(v) => setPersonal({ ...personal, gender: v as "Male" | "Female" | "Other" })}
                error={errors.gender}
              />
              <InputField
                label="Date of Birth *"
                icon={<Calendar size={15} />}
                value={personal.dob}
                onChange={(v) => setPersonal({ ...personal, dob: v })}
                error={errors.dob}
                type="date"
                min="1990-01-01"
                max={new Date().toISOString().split("T")[0]}
              />
              <InputField
                label="Email (Gmail)"
                icon={<Mail size={15} />}
                value={personal.email}
                onChange={(v) => setPersonal({ ...personal, email: v })}
                error={errors.email}
                placeholder="example@gmail.com"
                type="email"
              />
            </div>
            <div style={{ marginTop: "16px" }}>
              <InputField
                label="Address"
                icon={<MapPin size={15} />}
                value={personal.address}
                onChange={(v) => setPersonal({ ...personal, address: v })}
                placeholder="Full residential address"
                fullWidth
              />
            </div>
            <div style={{ marginTop: "16px" }}>
              <SelectField
                label="Class / Batch / Standard *"
                value={personal.batch}
                options={["", "5th Class", "6th Class", "7th Class", "8th Class", "9th Class", "10th Class", "11th Class", "12th Class"]}
                onChange={(v) => setPersonal({ ...personal, batch: v })}
                error={errors.batch}
              />
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3: Guardian Details (Students only) ═══════════ */}
        {currentStep === 3 && role === "student" && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "hsl(285,50%,12%)" }}>
              Guardian Information
            </h3>
            <p style={{ fontSize: "13px", color: "hsl(285,20%,50%)", margin: "0 0 24px" }}>
              Enter the student's parent / guardian details
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <InputField
                label="Father's Name *"
                icon={<User size={15} />}
                value={guardian.fatherName}
                onChange={(v) => setGuardian({ ...guardian, fatherName: v.replace(/[^a-zA-Z\s]/g, "") })}
                error={errors.fatherName}
                placeholder="Father's full name"
              />
              <InputField
                label="Father's Phone *"
                icon={<Phone size={15} />}
                value={guardian.fatherPhone}
                onChange={(v) => setGuardian({ ...guardian, fatherPhone: v.replace(/\D/g, "").slice(0, 10) })}
                error={errors.fatherPhone}
                placeholder="10-digit phone number"
                type="tel"
              />
              <InputField
                label="Mother's Name"
                icon={<User size={15} />}
                value={guardian.motherName}
                onChange={(v) => setGuardian({ ...guardian, motherName: v.replace(/[^a-zA-Z\s]/g, "") })}
                placeholder="Mother's full name"
              />
              <InputField
                label="Mother's Phone"
                icon={<Phone size={15} />}
                value={guardian.motherPhone}
                onChange={(v) => setGuardian({ ...guardian, motherPhone: v.replace(/\D/g, "").slice(0, 10) })}
                placeholder="10-digit phone number"
                type="tel"
              />
            </div>
          </div>
        )}

        {/* ═══════════ STEP 4: Fee Structure ═══════════ */}
        {currentStep === 4 && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "hsl(285,50%,12%)" }}>
              Fee Structure
            </h3>
            <p style={{ fontSize: "13px", color: "hsl(285,20%,50%)", margin: "0 0 24px" }}>
              Define the payment plan for this enrollment
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <InputField
                label="Total Fee Amount (₹) *"
                icon={<IndianRupee size={15} />}
                value={fee.totalAmount}
                onChange={(v) => {
                  const num = v.replace(/[^0-9]/g, "");
                  if (num === "" || Number(num) <= 9999999) setFee({ ...fee, totalAmount: num });
                }}
                error={errors.totalAmount}
                placeholder="e.g. 50000"
                type="text"
              />
            </div>

            <label style={{ fontSize: "13px", fontWeight: 600, color: "hsl(285,50%,12%)", marginBottom: "10px", display: "block" }}>
              Payment Plan *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {([
                { key: "single" as PaymentPlan, label: "Single Payment", desc: "Pay full amount at once" },
                { key: "2-installments" as PaymentPlan, label: "2 Installments", desc: "Split into 2 equal parts" },
                { key: "4-installments" as PaymentPlan, label: "4 Installments", desc: "Split into 4 equal parts" },
                { key: "custom" as PaymentPlan, label: "Custom Plan", desc: "Choose your own schedule" },
              ]).map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setFee({ ...fee, paymentPlan: plan.key })}
                  style={{
                    padding: "14px 16px", borderRadius: "12px", border: "2px solid",
                    borderColor: fee.paymentPlan === plan.key ? "hsl(271,91%,60%)" : "hsla(285,30%,20%,0.08)",
                    background: fee.paymentPlan === plan.key ? "hsla(271,91%,60%,0.04)" : "#fff",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (fee.paymentPlan !== plan.key) e.currentTarget.style.borderColor = "hsla(271,91%,60%,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    if (fee.paymentPlan !== plan.key) e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.08)";
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(285,50%,12%)", display: "block" }}>
                    {plan.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "hsl(285,20%,55%)" }}>
                    {plan.desc}
                  </span>
                </button>
              ))}
            </div>

            {fee.paymentPlan === "custom" && (
              <InputField
                label="Number of Installments"
                icon={<IndianRupee size={15} />}
                value={fee.customInstallments}
                onChange={(v) => setFee({ ...fee, customInstallments: v.replace(/[^0-9]/g, "") })}
                error={errors.customInstallments}
                placeholder="e.g. 3, 6, 12"
                type="text"
              />
            )}

            {/* Fee Breakdown Preview */}
            {fee.totalAmount && (
              <div style={{
                marginTop: "20px", padding: "16px", borderRadius: "12px",
                background: "hsla(271,91%,60%,0.04)", border: "1px solid hsla(271,91%,60%,0.12)",
              }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "hsl(271,91%,50%)", margin: "0 0 8px" }}>
                  Payment Breakdown
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "hsl(285,50%,12%)" }}>
                    {(() => {
                      const inst = fee.paymentPlan === "single" ? 1 : fee.paymentPlan === "2-installments" ? 2 : fee.paymentPlan === "4-installments" ? 4 : (Number(fee.customInstallments) || 1);
                      return `${inst} × ₹${Math.ceil(Number(fee.totalAmount) / inst).toLocaleString("en-IN")}`;
                    })()}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "hsl(271,91%,50%)" }}>
                    Total: ₹{Number(fee.totalAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "hsl(285,50%,12%)", marginBottom: "6px", display: "block" }}>
                Additional Notes
              </label>
              <textarea
                value={fee.notes}
                onChange={(e) => setFee({ ...fee, notes: e.target.value })}
                placeholder="Any special payment arrangements or notes..."
                style={{
                  width: "100%", minHeight: "80px", padding: "12px 14px", borderRadius: "10px",
                  border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px",
                  outline: "none", resize: "vertical", fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(271,91%,60%)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.12)")}
              />
            </div>
          </div>
        )}

        {/* ═══════════ Navigation Buttons ═══════════ */}
        {currentStep > 1 && (
        <>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: "32px", paddingTop: "20px", borderTop: "1px solid hsla(285,30%,20%,0.06)",
        }}>
          <button
            onClick={prevStep}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px",
              borderRadius: "10px", border: "1.5px solid hsla(285,30%,20%,0.12)",
              background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600,
              color: "hsl(285,20%,40%)", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(271,91%,60%)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.12)")}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={isSubmitting}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "10px 24px",
                borderRadius: "10px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "13px", fontWeight: 700,
                background: isSubmitting ? "hsl(0,0%,75%)" : "linear-gradient(135deg, hsl(271,91%,60%), hsl(328,100%,54%))",
                color: "#fff", opacity: isSubmitting ? 0.7 : 1, transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isSubmitting ? "Submitting..." : (currentStep === 2 && role !== "student" ? <><UserPlus size={16} /> Submit Enrollment</> : <>Next <ChevronRight size={16} /></>)}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "10px 28px",
                borderRadius: "10px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "13px", fontWeight: 700,
                background: isSubmitting ? "hsl(0,0%,75%)" : "linear-gradient(135deg, hsl(142,70%,40%), hsl(160,80%,35%))",
                color: "#fff", opacity: isSubmitting ? 0.7 : 1, transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <UserPlus size={16} /> {isSubmitting ? "Submitting..." : "Submit Enrollment"}
            </button>
          )}
        </div>
        {submitError && (
          <p style={{ color: "hsl(0,70%,50%)", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>
            {submitError}
          </p>
        )}
        </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────── Reusable Input Field ───────────────────────────
interface InputFieldProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  fullWidth?: boolean;
  min?: string;
  max?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon, value, onChange, error, placeholder, type = "text", fullWidth, min, max }) => (
  <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
    <label style={{ fontSize: "12px", fontWeight: 600, color: "hsl(285,50%,12%)", marginBottom: "6px", display: "block" }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{
          position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
          color: "hsl(285,20%,55%)", display: "flex",
        }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        style={{
          width: "100%", padding: icon ? "10px 14px 10px 36px" : "10px 14px",
          borderRadius: "10px", border: `1.5px solid ${error ? "hsl(0,70%,55%)" : "hsla(285,30%,20%,0.12)"}`,
          fontSize: "13px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = error ? "hsl(0,70%,55%)" : "hsl(271,91%,60%)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = error ? "hsl(0,70%,55%)" : "hsla(285,30%,20%,0.12)")}
      />
    </div>
    {error && <p style={{ fontSize: "11px", color: "hsl(0,70%,50%)", margin: "4px 0 0" }}>{error}</p>}
  </div>
);

// ─────────────────────────── Reusable Select Field ───────────────────────────
interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  error?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, options, onChange, error }) => (
  <div>
    <label style={{ fontSize: "12px", fontWeight: 600, color: "hsl(285,50%,12%)", marginBottom: "6px", display: "block" }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: "10px",
        border: `1.5px solid ${error ? "hsl(0,70%,55%)" : "hsla(285,30%,20%,0.12)"}`,
        fontSize: "13px", outline: "none", background: "#fff", fontFamily: "inherit",
        cursor: "pointer", boxSizing: "border-box", transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(271,91%,60%)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.12)")}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {error && <p style={{ fontSize: "11px", color: "hsl(0,70%,50%)", margin: "4px 0 0" }}>{error}</p>}
  </div>
);
