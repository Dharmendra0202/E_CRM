import React, { useState } from "react";
import {
  UserPlus, Users2, GraduationCap, Briefcase, ChevronRight, ChevronLeft,
  Check, User, Phone, Mail, MapPin, Calendar, IndianRupee, Shield, School, Hash,
} from "lucide-react";
import { api } from "../utils/api";
import { toTitleCase } from "../utils/styles";

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
  bloodGroup: string;
  schoolName: string;
  currentClass: string;
  city: string;
  state: string;
  pinCode: string;
}

interface GuardianDetails {
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
}

interface FeeDetails {
  totalAmount: string;
  paidToday: string;
  paymentMethod: string;
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
    bloodGroup: "", schoolName: "", currentClass: "", city: "", state: "", pinCode: "",
  });
  const [guardian, setGuardian] = useState<GuardianDetails>({
    fatherName: "", fatherPhone: "", motherName: "", motherPhone: "",
  });
  const [fee, setFee] = useState<FeeDetails>({
    totalAmount: "", paidToday: "0", paymentMethod: "CASH", paymentPlan: "single", customInstallments: "", notes: "",
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
          gender: personal.gender,
          bloodGroup: personal.bloodGroup,
          schoolName: personal.schoolName,
          currentClass: personal.currentClass,
          city: personal.city,
          state: personal.state,
          pinCode: personal.pinCode,
          address: personal.address || "",
          parentName: guardian.fatherName,
          parentPhone: guardian.fatherPhone,
          parentEmail: personal.email || `${personal.phone}@placeholder.com`,
          dateOfBirth: personal.dob,
          feeAmount: String(totalFee),
          paidToday: fee.paidToday || "0",
          paymentMethod: fee.paymentMethod || "CASH",
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
    setPersonal({ firstName: "", lastName: "", phone: "", gender: "Male", dob: "", email: "", address: "", batch: "", bloodGroup: "", schoolName: "", currentClass: "", city: "", state: "", pinCode: "" });
    setGuardian({ fatherName: "", fatherPhone: "", motherName: "", motherPhone: "" });
    setFee({ totalAmount: "", paidToday: "0", paymentMethod: "CASH", paymentPlan: "single", customInstallments: "", notes: "" });
    setErrors({});
    setSubmitted(false);
    setSubmitError("");
  };

  // ─────────── Steps config & Real-Time Progress ───────────
  const steps = [
    { num: 1, label: "Role" },
    { num: 2, label: "Personal Info" },
    ...(role === "student" ? [{ num: 3, label: "Guardian" }] : []),
    { num: 4, label: "Fee Structure" },
  ];

  // Dynamic real-time field completion calculations
  const isRoleSelected = Boolean(role);

  const step2Fields = [
    Boolean(personal.firstName.trim()),
    Boolean(personal.lastName.trim()),
    personal.phone.replace(/\D/g, "").length === 10,
    Boolean(personal.gender),
    Boolean(personal.dob),
    Boolean(personal.email.trim()),
    Boolean(personal.address.trim()),
    Boolean(personal.batch),
  ];
  const step2Ratio = step2Fields.filter(Boolean).length / step2Fields.length;

  const step3Fields = [
    Boolean(guardian.fatherName.trim()),
    guardian.fatherPhone.replace(/\D/g, "").length === 10,
    Boolean(guardian.motherName.trim()),
    guardian.motherPhone.replace(/\D/g, "").length === 10,
  ];
  const step3Ratio = step3Fields.filter(Boolean).length / step3Fields.length;

  const step4Fields = [
    Boolean(fee.totalAmount.trim()),
    Boolean(fee.paidToday.trim()),
    Boolean(fee.paymentMethod),
    Boolean(fee.paymentPlan),
  ];
  const step4Ratio = step4Fields.filter(Boolean).length / step4Fields.length;

  const getConnectorProgress = (fromStepNum: number) => {
    if (currentStep > fromStepNum) return 100;
    if (currentStep === fromStepNum) {
      if (fromStepNum === 1) return isRoleSelected ? 100 : 0;
      if (fromStepNum === 2) return Math.round(step2Ratio * 100);
      if (fromStepNum === 3) return Math.round(step3Ratio * 100);
    }
    return 0;
  };

  const overallProgress = (() => {
    if (currentStep === 1) return isRoleSelected ? 25 : 5;
    if (currentStep === 2) return Math.min(50, Math.round(25 + step2Ratio * 25));
    if (currentStep === 3) return Math.min(75, Math.round(50 + step3Ratio * 25));
    if (currentStep === 4) return Math.min(100, Math.round(75 + step4Ratio * 25));
    return 0;
  })();

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
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", color: "#343a40" }}>
            Enrollment Successful!
          </h2>
          <p style={{ fontSize: "14px", color: "#6c757d", margin: "0 0 24px" }}>
            {personal.firstName} {personal.lastName} has been enrolled as a <strong>{role}</strong>.
          </p>
          <button
            onClick={resetForm}
            style={{
              padding: "12px 28px", borderRadius: "12px", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #0069d9, #007bff)",
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
    <div style={{
      padding: currentStep === 1 ? "24px 16px" : "12px 16px 24px",
      maxWidth: "640px",
      margin: "0 auto",
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header — Only shown on initial Role selection step */}
      {currentStep === 1 && (
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px", color: "#343a40" }}>
            New Enrollment
          </h1>
          <p style={{ fontSize: "13px", color: "#6c757d", margin: 0 }}>
            Add a new student, staff member, or teacher to the system
          </p>
        </div>
      )}

      {/* Step Indicator with Real-Time Filling Connectors */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        marginBottom: "20px",
        padding: "0 4px",
      }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                background: currentStep >= step.num
                  ? "linear-gradient(135deg, #0069d9, #007bff)"
                  : "hsla(285,30%,20%,0.06)",
                color: currentStep >= step.num ? "#fff" : "#6c757d",
                transition: "all 0.3s ease",
              }}>
                {currentStep > step.num ? <Check size={13} /> : step.num}
              </div>
              <span style={{
                fontSize: "11px", fontWeight: 600,
                color: currentStep >= step.num ? "#343a40" : "#6c757d",
              }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: "3px",
                borderRadius: "3px",
                margin: "0 8px",
                background: "hsla(285,30%,20%,0.08)",
                overflow: "hidden",
                position: "relative",
              }}>
                <div style={{
                  height: "100%",
                  width: `${getConnectorProgress(step.num)}%`,
                  background: "linear-gradient(90deg, #0069d9, #007bff)",
                  borderRadius: "3px",
                  transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Card */}
      <div style={{
        background: "#fff",
        borderRadius: "18px",
        padding: currentStep === 1 ? "24px" : "20px 24px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
        border: "1px solid hsla(285,30%,20%,0.06)",
      }}>
        {/* ═══════════ STEP 1: Role Selection ═══════════ */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "#343a40" }}>
              I am enrolling a...
            </h3>
            <p style={{ fontSize: "13px", color: "#6c757d", margin: "0 0 24px" }}>
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
                    borderColor: role === item.key ? "#0069d9" : "hsla(285,30%,20%,0.08)",
                    background: role === item.key ? "rgba(0,123,255,0.04)" : "#fff",
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                  }}
                  onMouseEnter={(e) => {
                    if (role !== item.key) e.currentTarget.style.borderColor = "rgba(0,123,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    if (role !== item.key) e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.08)";
                  }}
                >
                  <div style={{ color: role === item.key ? "#0069d9" : "#6c757d", transition: "color 0.2s" }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#343a40" }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "#6c757d" }}>
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
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 2px", color: "#343a40" }}>
              Personal Information
            </h3>
            <p style={{ fontSize: "12px", color: "#6c757d", margin: "0 0 16px" }}>
              Enter the {role}'s basic details
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <InputField
                label="First Name *"
                icon={<User size={14} />}
                value={personal.firstName}
                onChange={(v) => setPersonal({ ...personal, firstName: toTitleCase(v.replace(/[^a-zA-Z\s]/g, "")) })}
                error={errors.firstName}
                placeholder="Enter first name"
              />
              <InputField
                label="Last Name"
                icon={<User size={14} />}
                value={personal.lastName}
                onChange={(v) => setPersonal({ ...personal, lastName: toTitleCase(v.replace(/[^a-zA-Z\s]/g, "")) })}
                placeholder="Enter last name"
              />
              <InputField
                label="Phone Number *"
                icon={<Phone size={14} />}
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
                icon={<Calendar size={14} />}
                value={personal.dob}
                onChange={(v) => {
                  // Reject future dates — clamp to today
                  const today = new Date().toISOString().split("T")[0];
                  setPersonal({ ...personal, dob: v && v > today ? today : v });
                }}
                error={errors.dob}
                type="date"
                min="2000-01-01"
                max={new Date().toISOString().split("T")[0]}
              />
              <InputField
                label="Email (Gmail)"
                icon={<Mail size={14} />}
                value={personal.email}
                onChange={(v) => setPersonal({ ...personal, email: v })}
                error={errors.email}
                placeholder="example@gmail.com"
                type="email"
              />
              <SelectField
                label="Blood Group"
                value={personal.bloodGroup}
                options={["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                onChange={(v) => setPersonal({ ...personal, bloodGroup: v })}
              />
              <InputField
                label="School / College Name"
                icon={<School size={14} />}
                value={personal.schoolName}
                onChange={(v) => setPersonal({ ...personal, schoolName: toTitleCase(v) })}
                placeholder="Where the student currently studies"
              />
              <InputField
                label="Current Class / Grade"
                icon={<GraduationCap size={14} />}
                value={personal.currentClass}
                onChange={(v) => setPersonal({ ...personal, currentClass: v })}
                placeholder="e.g. Class 10, 12th Science"
              />
            </div>
            <div style={{ marginTop: "12px" }}>
              <InputField
                label="Address"
                icon={<MapPin size={14} />}
                value={personal.address}
                onChange={(v) => setPersonal({ ...personal, address: toTitleCase(v) })}
                placeholder="Full residential address"
                fullWidth
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
              <InputField
                label="City"
                icon={<MapPin size={14} />}
                value={personal.city}
                onChange={(v) => setPersonal({ ...personal, city: toTitleCase(v) })}
                placeholder="City"
              />
              <InputField
                label="State"
                icon={<MapPin size={14} />}
                value={personal.state}
                onChange={(v) => setPersonal({ ...personal, state: toTitleCase(v) })}
                placeholder="State"
              />
              <InputField
                label="Pin Code"
                icon={<Hash size={14} />}
                value={personal.pinCode}
                onChange={(v) => setPersonal({ ...personal, pinCode: v.replace(/\D/g, "").slice(0, 6) })}
                placeholder="6-digit PIN"
                type="tel"
              />
            </div>
            <div style={{ marginTop: "12px" }}>
              <SelectField
                label="Class / Batch / Standard *"
                value={personal.batch}
                options={["", "1st Standard", "2nd Standard", "3rd Standard", "4th Standard", "5th Standard", "6th Standard", "7th Standard", "8th Standard", "9th Standard", "10th Standard", "11th Science (PCM)", "11th Science (PCB)", "11th Science (PCMB)", "11th Commerce (SP)", "11th Commerce (Maths)", "12th Science (PCM)", "12th Science (PCB)", "12th Science (PCMB)", "12th Commerce (SP)", "12th Commerce (Maths)"]}
                onChange={(v) => setPersonal({ ...personal, batch: v })}
                error={errors.batch}
              />
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3: Guardian Details (Students only) ═══════════ */}
        {currentStep === 3 && role === "student" && (
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 2px", color: "#343a40" }}>
              Guardian Information
            </h3>
            <p style={{ fontSize: "12px", color: "#6c757d", margin: "0 0 16px" }}>
              Enter the student's parent / guardian details
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <InputField
                label="Father's Name *"
                icon={<User size={14} />}
                value={guardian.fatherName}
                onChange={(v) => setGuardian({ ...guardian, fatherName: toTitleCase(v.replace(/[^a-zA-Z\s]/g, "")) })}
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
                onChange={(v) => setGuardian({ ...guardian, motherName: toTitleCase(v.replace(/[^a-zA-Z\s]/g, "")) })}
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
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "#343a40" }}>
              Fee Structure
            </h3>
            <p style={{ fontSize: "13px", color: "#6c757d", margin: "0 0 24px" }}>
              Define the payment plan for this enrollment
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
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
              <InputField
                label="Amount Paid Today (₹)"
                icon={<IndianRupee size={15} />}
                value={fee.paidToday}
                onChange={(v) => {
                  const num = v.replace(/[^0-9]/g, "");
                  setFee({ ...fee, paidToday: num });
                }}
                placeholder="e.g. 10000"
                type="text"
              />
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#343a40", marginBottom: "6px", display: "block" }}>
                  Payment Method Today
                </label>
                <select
                  value={fee.paymentMethod}
                  onChange={(e) => setFee({ ...fee, paymentMethod: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "10px",
                    border: "1.5px solid hsla(285,30%,20%,0.12)", fontSize: "13px",
                    outline: "none", fontFamily: "inherit", background: "#fff",
                  }}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI Payout / QR</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            <label style={{ fontSize: "13px", fontWeight: 600, color: "#343a40", marginBottom: "10px", display: "block" }}>
              Payment Plan for Remaining Amount *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {([
                { key: "single" as PaymentPlan, label: "Single Payment", desc: "Pay full balance at once" },
                { key: "2-installments" as PaymentPlan, label: "2 Installments", desc: "Split remaining balance into 2 parts" },
                { key: "4-installments" as PaymentPlan, label: "4 Installments", desc: "Split remaining balance into 4 parts" },
                { key: "custom" as PaymentPlan, label: "Custom Plan", desc: "Choose your own schedule" },
              ]).map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setFee({ ...fee, paymentPlan: plan.key })}
                  style={{
                    padding: "14px 16px", borderRadius: "12px", border: "2px solid",
                    borderColor: fee.paymentPlan === plan.key ? "#0069d9" : "hsla(285,30%,20%,0.08)",
                    background: fee.paymentPlan === plan.key ? "rgba(0,123,255,0.04)" : "#fff",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (fee.paymentPlan !== plan.key) e.currentTarget.style.borderColor = "rgba(0,123,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    if (fee.paymentPlan !== plan.key) e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.08)";
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#343a40", display: "block" }}>
                    {plan.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "#6c757d" }}>
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

            {/* Auto-Calculated Fee & Installment Breakdown Preview */}
            {fee.totalAmount && (
              <div style={{
                marginTop: "20px", padding: "18px", borderRadius: "14px",
                background: "rgba(0,123,255,0.05)", border: "1px solid rgba(0,123,255,0.15)",
                display: "flex", flexDirection: "column", gap: "10px"
              }}>
                <p style={{ fontSize: "12px", fontWeight: 800, color: "#0062cc", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  📊 Auto-Calculated Fee & Installment Breakdown
                </p>

                {(() => {
                  const total = Number(fee.totalAmount) || 0;
                  const paid = Number(fee.paidToday) || 0;
                  const remaining = Math.max(0, total - paid);
                  const instCount = fee.paymentPlan === "single" ? 1 : fee.paymentPlan === "2-installments" ? 2 : fee.paymentPlan === "4-installments" ? 4 : (Number(fee.customInstallments) || 1);
                  const instAmount = remaining > 0 ? Math.ceil(remaining / instCount) : 0;

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#fff", padding: "14px", borderRadius: "12px", border: "1px solid hsla(285,30%,20%,0.06)" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#6c757d", fontWeight: 600 }}>Total Fee Billed</span>
                        <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 800, color: "#0069d9" }}>₹{total.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "#6c757d", fontWeight: 600 }}>Paid Today ({fee.paymentMethod})</span>
                        <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 800, color: "hsl(142,70%,40%)" }}>₹{paid.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "#6c757d", fontWeight: 600 }}>Remaining Dues</span>
                        <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 800, color: remaining > 0 ? "hsl(205, 85%, 50%)" : "hsl(142,70%,40%)" }}>₹{remaining.toLocaleString("en-IN")}</p>
                      </div>
                      {remaining > 0 ? (
                        <div style={{ gridColumn: "1 / -1", borderTop: "1px solid hsla(285,30%,20%,0.08)", paddingTop: "10px", marginTop: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#343a40" }}>
                            🗓️ Auto Installments: {instCount} installment{instCount > 1 ? "s" : ""} of <strong>₹{instAmount.toLocaleString("en-IN")}</strong> each for remaining ₹{remaining.toLocaleString("en-IN")} dues
                          </span>
                        </div>
                      ) : (
                        <div style={{ gridColumn: "1 / -1", borderTop: "1px solid hsla(285,30%,20%,0.08)", paddingTop: "10px", marginTop: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "hsl(142,70%,40%)" }}>
                            🎉 Fee Settled in Full! No remaining installment dues.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#343a40", marginBottom: "6px", display: "block" }}>
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
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0069d9")}
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
          marginTop: "20px", paddingTop: "14px", borderTop: "1px solid hsla(285,30%,20%,0.06)",
        }}>
          <button
            onClick={prevStep}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
              borderRadius: "8px", border: "1.5px solid hsla(285,30%,20%,0.12)",
              background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600,
              color: "#6c757d", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0069d9")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.12)")}
          >
            <ChevronLeft size={15} /> Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={isSubmitting}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px",
                borderRadius: "8px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "12.5px", fontWeight: 700,
                background: isSubmitting ? "hsl(0,0%,75%)" : "linear-gradient(135deg, #0069d9, #007bff)",
                color: "#fff", opacity: isSubmitting ? 0.7 : 1, transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isSubmitting ? "Submitting..." : (currentStep === 2 && role !== "student" ? <><UserPlus size={15} /> Submit Enrollment</> : <>Next <ChevronRight size={15} /></>)}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "8px 22px",
                borderRadius: "8px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "12.5px", fontWeight: 700,
                background: isSubmitting ? "hsl(0,0%,75%)" : "linear-gradient(135deg, hsl(142,70%,40%), hsl(160,80%,35%))",
                color: "#fff", opacity: isSubmitting ? 0.7 : 1, transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <UserPlus size={15} /> {isSubmitting ? "Submitting..." : "Submit Enrollment"}
            </button>
          )}
        </div>
        {submitError && (
          <p style={{ color: "hsl(0,70%,50%)", fontSize: "12px", marginTop: "10px", textAlign: "center" }}>
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
    <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#343a40", marginBottom: "4px", display: "block" }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{
          position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
          color: "#6c757d", display: "flex",
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
        autoCapitalize={type === "text" ? "words" : undefined}
        style={{
          width: "100%", padding: icon ? "8px 12px 8px 32px" : "8px 12px",
          borderRadius: "8px", border: `1.5px solid ${error ? "hsl(0,70%,55%)" : "hsla(285,30%,20%,0.12)"}`,
          fontSize: "12.5px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          transition: "border-color 0.2s",
          textTransform: type === "text" ? "capitalize" : "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = error ? "hsl(0,70%,55%)" : "#0069d9")}
        onBlur={(e) => (e.currentTarget.style.borderColor = error ? "hsl(0,70%,55%)" : "hsla(285,30%,20%,0.12)")}
      />
    </div>
    {error && <p style={{ fontSize: "11px", color: "hsl(0,70%,50%)", margin: "3px 0 0" }}>{error}</p>}
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
    <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#343a40", marginBottom: "4px", display: "block" }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 12px", borderRadius: "8px",
        border: `1.5px solid ${error ? "hsl(0,70%,55%)" : "hsla(285,30%,20%,0.12)"}`,
        fontSize: "12.5px", outline: "none", background: "#fff", fontFamily: "inherit",
        cursor: "pointer", boxSizing: "border-box", transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#0069d9")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "hsla(285,30%,20%,0.12)")}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {error && <p style={{ fontSize: "11px", color: "hsl(0,70%,50%)", margin: "3px 0 0" }}>{error}</p>}
  </div>
);
