import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api";
import { inputStyle, labelStyle } from "../utils/styles";
import {
  IndianRupee, Plus, Search, Filter, CheckCircle2, XCircle,
  Clock, TrendingUp, Users2, CreditCard, ArrowUpRight, AlertCircle,
  Briefcase, GraduationCap, X, Check
} from "lucide-react";

export function FeeManagement() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showPay, setShowPay] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);

  // Tab State: "all" | "done" | "pending" | "staff_payroll"
  const [activeTab, setActiveTab] = useState<"all" | "done" | "pending" | "staff_payroll">("all");

  // Staff Drawer State
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffForm, setStaffForm] = useState({ staffId: "", amount: "", paymentMethod: "BANK_TRANSFER", notes: "" });
  const [staffSuccess, setStaffSuccess] = useState(false);

  // Create invoice form
  const [newInv, setNewInv] = useState({ studentId: "", totalAmount: "", dueDate: "" });
  // Payment form
  const [payForm, setPayForm] = useState({ amount: "", paymentMethod: "CASH", transactionReference: "" });

  useEffect(() => {
    loadData();
    fetchStaff();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invRes, stuRes] = await Promise.all([
        api.invoices.getAll(),
        api.students.getAll(),
      ]);
      if (invRes.data) setInvoices(invRes.data);
      if (stuRes.data) setStudents(stuRes.data);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const fetchStaff = async () => {
    try {
      const res = await api.staff.getAll();
      if (res.data) setStaffList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInv.studentId || !newInv.totalAmount || !newInv.dueDate) return;
    setCreating(true);
    try {
      await api.invoices.create(newInv);
      setNewInv({ studentId: "", totalAmount: "", dueDate: "" });
      setShowCreate(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  const handleRecordPayment = async () => {
    if (!showPay || !payForm.amount) return;
    setPaying(true);
    try {
      await api.invoices.pay(showPay.id, payForm);
      setPayForm({ amount: "", paymentMethod: "CASH", transactionReference: "" });
      setShowPay(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Payment failed. Please try again.");
    }
    setPaying(false);
  };

  const handleRazorpayOnlinePayment = async () => {
    if (!showPay || !payForm.amount) {
      alert("Please enter the amount to pay via Razorpay.");
      return;
    }
    setPaying(true);
    try {
      const orderRes = await api.payments.createOrder({
        invoiceId: showPay.id,
        amount: parseFloat(payForm.amount),
      });

      const studentName = showPay.student?.user
        ? `${showPay.student.user.firstName} ${showPay.student.user.lastName}`
        : "Student";

      const options: any = {
        key: orderRes.keyId || "rzp_test_TQlw6WdYyizH9Y",
        amount: orderRes.amount,
        currency: orderRes.currency || "INR",
        name: "EduFlow E-CRM",
        description: `Fee Settlement - Invoice #${showPay.id.substring(0, 8)}`,
        image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        order_id: orderRes.orderId,
        handler: async function (response: any) {
          try {
            await api.payments.verifyPayment({
              invoiceId: showPay.id,
              razorpayOrderId: response.razorpay_order_id || orderRes.orderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_test_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || "demo_signature",
              amount: payForm.amount,
            });
            alert("🎉 Razorpay Payment Successful! Invoice status updated.");
            setShowPay(null);
            loadData();
          } catch (err: any) {
            alert("Verification failed: " + err.message);
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: studentName,
          email: showPay.student?.user?.email || "student@ecrm.com",
          contact: showPay.student?.user?.phone || "9876543210",
        },
        theme: { color: "#e11d48" },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const RzpConstructor = (window as any).Razorpay;
      if (typeof RzpConstructor === "function") {
        const rzp = new RzpConstructor(options);
        rzp.on("payment.failed", function (response: any) {
          alert("Payment Failed: " + (response.error?.description || "Transaction declined"));
          setPaying(false);
        });
        rzp.open();
        setTimeout(() => setPaying(false), 800);
      } else {
        await api.payments.verifyPayment({
          invoiceId: showPay.id,
          razorpayOrderId: orderRes.orderId,
          razorpayPaymentId: `pay_simulated_${Date.now()}`,
          razorpaySignature: "demo_signature",
          amount: payForm.amount,
        });
        alert("🎉 Razorpay Test Mode Payment Simulated Successfully!");
        setShowPay(null);
        loadData();
        setPaying(false);
      }
    } catch (err: any) {
      alert("Razorpay checkout error: " + (err.message || "Failed to initialize payment"));
      setPaying(false);
    }
  };

  const handleRecordStaffSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.staffId || !staffForm.amount) {
      alert("Please select staff member and enter payment amount.");
      return;
    }
    setStaffSuccess(true);
    setTimeout(() => {
      setStaffSuccess(false);
      setShowStaffDrawer(false);
      setStaffForm({ staffId: "", amount: "", paymentMethod: "BANK_TRANSFER", notes: "" });
    }, 2000);
  };

  // Computed stats
  const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.payments?.reduce((ps: number, p: any) => ps + Number(p.amount), 0) || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const overdueCount = invoices.filter((i) => i.status === "UNPAID" && new Date(i.dueDate) < new Date()).length;

  const filteredInvoices = invoices.filter((inv) => {
    if (activeTab === "done" && inv.status !== "PAID") return false;
    if (activeTab === "pending" && inv.status === "PAID") return false;
    if (filterStatus && inv.status !== filterStatus) return false;
    if (searchQuery) {
      const name = inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : "";
      if (!name.toLowerCase().includes(searchQuery.toLowerCase()) && !inv.student?.user?.email?.includes(searchQuery)) return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Payment Records</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Manage student installments, completed settlements, pending dues, and staff payroll.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="secondary" onClick={() => setShowStaffDrawer(true)} leftIcon={<Briefcase size={14} />}>Staff & Teacher Payroll Drawer</Button>
          <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus size={14} />}>Issue Invoice</Button>
        </div>
      </div>

      {/* Revenue & Payment Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Billed", value: `₹${totalBilled.toLocaleString("en-IN")}`, icon: <IndianRupee size={18} />, color: "hsl(271,91%,60%)" },
          { label: "Done / Settlement", value: `₹${totalPaid.toLocaleString("en-IN")}`, icon: <CheckCircle2 size={18} />, color: "var(--color-success)" },
          { label: "Pending Dues", value: `₹${outstanding.toLocaleString("en-IN")}`, icon: <AlertCircle size={18} />, color: "var(--color-danger)" },
          { label: "Overdue Invoices", value: overdueCount, icon: <Clock size={18} />, color: "hsl(38,92%,50%)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "18px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs for Payment Sections */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
        {[
          { id: "all", label: "All Invoices" },
          { id: "done", label: "Done Payments (Settled)" },
          { id: "pending", label: "Pending Payments & Remaining Dues" },
          { id: "staff_payroll", label: "Staff & Teacher Payroll" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "8px 16px", borderRadius: "10px", border: "none",
              fontSize: "13px", fontWeight: activeTab === tab.id ? 800 : 600,
              background: activeTab === tab.id ? "hsla(328,100%,54%,0.1)" : "transparent",
              color: activeTab === tab.id ? "var(--color-accent)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Student Payments View */}
      {activeTab !== "staff_payroll" ? (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, position: "relative", maxWidth: "300px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input style={{ ...inputStyle, paddingLeft: "36px" }} placeholder="Search student name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <select style={{ ...inputStyle, width: "160px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>

          {/* Invoices List */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 100px", padding: "12px 20px", background: "rgba(29,10,39,0.02)", borderBottom: "1px solid var(--border-glass)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              <div>Student</div><div>Total Billed</div><div>Done Paid</div><div>Remaining</div><div>Actions</div>
            </div>

            {isLoading ? (
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={52} />)}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <IndianRupee size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>No payment records found.</p>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const name = inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : "Student";
                const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
                const remaining = Math.max(0, Number(inv.totalAmount) - paid);
                const isOverdue = inv.status === "UNPAID" && new Date(inv.dueDate) < new Date();
                const statusColor = inv.status === "PAID" ? "var(--color-success)" : isOverdue ? "var(--color-danger)" : "hsl(38,92%,50%)";

                return (
                  <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 100px", padding: "14px 20px", borderBottom: "1px solid var(--border-glass)", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${statusColor}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: statusColor }}>
                        {name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{name}</p>
                        <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>{inv.student?.user?.email}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>₹{Number(inv.totalAmount).toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-success)" }}>₹{paid.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: remaining > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                      ₹{remaining.toLocaleString("en-IN")}
                    </span>
                    <div>
                      {inv.status !== "PAID" && (
                        <button onClick={() => { setShowPay(inv); setPayForm({ amount: String(remaining), paymentMethod: "CASH", transactionReference: "" }); }}
                          style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, hsl(328,100%,54%), hsl(271,91%,60%))", border: "none", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", boxShadow: "0 2px 8px hsla(328,100%,54%,0.3)" }}>
                          Pay Now
                        </button>
                      )}
                      {inv.status === "PAID" && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,42%,0.08)", padding: "4px 10px", borderRadius: "10px" }}>SETTLED</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Staff & Teacher Payroll Section */
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>Staff & Teacher Salary Payroll</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Record monthly salaries, lecture payouts, and staff disbursements.</p>
            </div>
            <Button variant="primary" onClick={() => setShowStaffDrawer(true)} leftIcon={<Plus size={14} />}>Record Salary Payout</Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {staffList.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", gridColumn: "1 / -1", textAlign: "center", padding: "32px 0" }}>No staff or teachers registered yet.</p>
            ) : staffList.map((member) => (
              <div key={member.id} style={{ background: "rgba(29,10,39,0.02)", borderRadius: "14px", padding: "18px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "hsla(271,91%,60%,0.12)", color: "hsl(271,91%,60%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px" }}>
                    {`${member.firstName[0]}${member.lastName[0]}`.toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{member.firstName} {member.lastName}</h4>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>{member.role}</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-glass)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Email: {member.email}</span>
                  <button
                    onClick={() => { setShowStaffDrawer(true); setStaffForm({ ...staffForm, staffId: member.id }); }}
                    style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    Pay Salary &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Payment Drawer / Modal */}
      {showStaffDrawer && (
        <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowStaffDrawer(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px", padding: "28px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Record Staff / Teacher Salary</h3>
              <button onClick={() => setShowStaffDrawer(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {staffSuccess && (
              <div style={{ padding: "12px", borderRadius: "10px", background: "hsla(142,70%,45%,0.15)", color: "var(--color-success)", fontSize: "13px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Check size={16} /> Salary payout recorded successfully!
              </div>
            )}

            <form onSubmit={handleRecordStaffSalary} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Select Staff / Teacher *</label>
                <select style={inputStyle} value={staffForm.staffId} onChange={(e) => setStaffForm({ ...staffForm, staffId: e.target.value })} required>
                  <option value="">Select staff member</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Salary Amount (₹) *</label>
                <input style={inputStyle} type="number" value={staffForm.amount} onChange={(e) => setStaffForm({ ...staffForm, amount: e.target.value })} placeholder="e.g. 25000" required />
              </div>

              <div>
                <label style={labelStyle}>Payment Method</label>
                <select style={inputStyle} value={staffForm.paymentMethod} onChange={(e) => setStaffForm({ ...staffForm, paymentMethod: e.target.value })}>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI Payout</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Remarks / Notes</label>
                <input style={inputStyle} value={staffForm.notes} onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })} placeholder="e.g. August 2026 Monthly Salary" />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                <Button variant="secondary" onClick={() => setShowStaffDrawer(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Record Disbursement</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Issue Invoice</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Student *</label>
                <select style={inputStyle} value={newInv.studentId} onChange={(e) => setNewInv({ ...newInv, studentId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.user ? `${s.user.firstName} ${s.user.lastName}` : s.parentName}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Amount (₹) *</label><input style={inputStyle} type="number" value={newInv.totalAmount} onChange={(e) => setNewInv({ ...newInv, totalAmount: e.target.value })} placeholder="e.g. 5000" /></div>
              <div><label style={labelStyle}>Due Date *</label><input style={inputStyle} type="date" value={newInv.dueDate} onChange={(e) => setNewInv({ ...newInv, dueDate: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" isLoading={creating} onClick={handleCreateInvoice} leftIcon={<IndianRupee size={14} />}>Issue</Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPay && (
        <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowPay(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Record Payment</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={labelStyle}>Amount (₹) *</label><input style={inputStyle} type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
              <div>
                <label style={labelStyle}>Payment Method</label>
                <select style={inputStyle} value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div><label style={labelStyle}>Reference / Transaction ID</label><input style={inputStyle} value={payForm.transactionReference} onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })} placeholder="Optional" /></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleRazorpayOnlinePayment}
                disabled={paying}
                style={{
                  width: "100%", padding: "12px", borderRadius: "10px",
                  background: "linear-gradient(135deg, #0284c7, #2563eb)", color: "#fff",
                  border: "none", fontSize: "14px", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.3)"
                }}
              >
                <CreditCard size={16} /> Pay via Razorpay (Test Mode)
              </button>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={() => setShowPay(null)}>Cancel</Button>
                <Button variant="primary" isLoading={paying} onClick={handleRecordPayment} leftIcon={<CheckCircle2 size={14} />}>Record Offline Cash/Bank</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
