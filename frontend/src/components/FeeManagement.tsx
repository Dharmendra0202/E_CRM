import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import {
  IndianRupee, Plus, Search, Filter, CheckCircle2, XCircle,
  Clock, TrendingUp, Users2, CreditCard, ArrowUpRight, AlertCircle,
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

  // Create invoice form
  const [newInv, setNewInv] = useState({ studentId: "", totalAmount: "", dueDate: "" });
  // Payment form
  const [payForm, setPayForm] = useState({ amount: "", paymentMethod: "CASH", transactionReference: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invRes, stuRes] = await Promise.all([
        api.invoices.getAll(),
        api.students.getAll(),
      ]);
      if (invRes.data) setInvoices(invRes.data);
      if (stuRes.data) setStudents(stuRes.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleCreateInvoice = async () => {
    if (!newInv.studentId || !newInv.totalAmount || !newInv.dueDate) return;
    setCreating(true);
    try {
      await api.invoices.create(newInv);
      setNewInv({ studentId: "", totalAmount: "", dueDate: "" });
      setShowCreate(false);
      loadData();
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
    setPaying(false);
  };

  // Computed stats
  const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.payments?.reduce((ps: number, p: any) => ps + Number(p.amount), 0) || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const overdueCount = invoices.filter((i) => i.status === "UNPAID" && new Date(i.dueDate) < new Date()).length;

  const filtered = invoices.filter((inv) => {
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
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Fee Management</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Track invoices, payments, and outstanding dues.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus size={14} />}>Issue Invoice</Button>
      </div>

      {/* Revenue Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Billed", value: `₹${totalBilled.toLocaleString("en-IN")}`, icon: <IndianRupee size={18} />, color: "hsl(271,91%,60%)" },
          { label: "Collected", value: `₹${totalPaid.toLocaleString("en-IN")}`, icon: <CheckCircle2 size={18} />, color: "var(--color-success)" },
          { label: "Outstanding", value: `₹${outstanding.toLocaleString("en-IN")}`, icon: <AlertCircle size={18} />, color: "var(--color-danger)" },
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

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={{ flex: 1, position: "relative", maxWidth: "300px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input style={{ ...inputStyle, paddingLeft: "36px" }} placeholder="Search by student name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 100px 100px", padding: "12px 20px", background: "rgba(29,10,39,0.02)", borderBottom: "1px solid var(--border-glass)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
          <div>Student</div><div>Amount</div><div>Paid</div><div>Due Date</div><div>Actions</div>
        </div>

        {isLoading ? (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={52} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <IndianRupee size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>No invoices found.</p>
          </div>
        ) : (
          filtered.map((inv) => {
            const name = inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : "Unknown";
            const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
            const isOverdue = inv.status === "UNPAID" && new Date(inv.dueDate) < new Date();
            const statusColor = inv.status === "PAID" ? "var(--color-success)" : isOverdue ? "var(--color-danger)" : "hsl(38,92%,50%)";

            return (
              <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 100px 100px", padding: "14px 20px", borderBottom: "1px solid var(--border-glass)", alignItems: "center" }}>
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
                <span style={{ fontSize: "13px", fontWeight: 600, color: paid > 0 ? "var(--color-success)" : "var(--text-secondary)" }}>₹{paid.toLocaleString("en-IN")}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: isOverdue ? "var(--color-danger)" : "var(--text-secondary)" }}>
                  {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <div>
                  {inv.status !== "PAID" && (
                    <button onClick={() => { setShowPay(inv); setPayForm({ amount: String(Number(inv.totalAmount) - paid), paymentMethod: "CASH", transactionReference: "" }); }}
                      style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,42%,0.08)", border: "1px solid hsla(142,70%,42%,0.2)", padding: "5px 10px", borderRadius: "8px", cursor: "pointer" }}>
                      Pay
                    </button>
                  )}
                  {inv.status === "PAID" && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,42%,0.08)", padding: "4px 10px", borderRadius: "10px" }}>PAID</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowCreate(false)}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowPay(null)}>
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
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowPay(null)}>Cancel</Button>
              <Button variant="primary" isLoading={paying} onClick={handleRecordPayment} leftIcon={<CheckCircle2 size={14} />}>Record Payment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
