import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Receipt, Download, Loader2, Search } from "lucide-react";

const ACCENT = "#007bff";
const LABEL = "#60686f";
const VALUE = "#6c757d";
const CARD_SHADOW = "rgba(90, 97, 105, 0.1) 0px 7.5px 35px 0px, rgba(90, 97, 105, 0.1) 0px 2px 3px 0px";
const FONT = "'Nunito', 'Segoe UI', Arial, sans-serif";

interface ReceiptRow {
  id: string;
  date: string;
  receiptNumber: string;
  studentName: string;
  method: string;
  amount: number;
}

export function FeeReceipt({ userRole = "STUDENT" }: { userRole?: string }) {
  const isStudent = userRole === "STUDENT" || userRole === "PARENT";
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.invoices.getAll();
        const invoices = res.data || [];
        // Each payment on an invoice = one receipt
        const receipts: ReceiptRow[] = [];
        for (const inv of invoices) {
          const studentName = inv.student?.user
            ? `${inv.student.user.firstName || ""} ${inv.student.user.lastName || ""}`.trim()
            : "—";
          for (const p of inv.payments || []) {
            receipts.push({
              id: p.id,
              date: p.paidAt,
              receiptNumber: p.transactionReference || `RCPT-${p.id.slice(0, 8).toUpperCase()}`,
              studentName,
              method: p.paymentMethod || "—",
              amount: Number(p.amount || 0),
            });
          }
        }
        receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRows(receipts);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const filtered = rows.filter((r) =>
    [r.receiptNumber, r.studentName, r.method].some((v) => (v || "").toLowerCase().includes(search.toLowerCase()))
  );

  const downloadReceipt = (r: ReceiptRow) => {
    // Generate a simple printable receipt in a new window
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt ${r.receiptNumber}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#333}
        .head{text-align:center;border-bottom:2px solid ${ACCENT};padding-bottom:16px;margin-bottom:24px}
        .head h1{color:${ACCENT};margin:0;font-size:22px}
        .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
        .label{color:#666;font-size:13px}.val{font-weight:600;font-size:13px}
        .total{margin-top:20px;padding:14px;background:#eef0fe;border-radius:8px;display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:${ACCENT}}
      </style></head><body>
      <div class="head"><h1>Fee Receipt</h1><p style="color:#888;margin:6px 0 0">Payment Confirmation</p></div>
      <div class="row"><span class="label">Receipt Number</span><span class="val">${r.receiptNumber}</span></div>
      <div class="row"><span class="label">Date</span><span class="val">${fmtDate(r.date)}</span></div>
      <div class="row"><span class="label">Student</span><span class="val">${r.studentName}</span></div>
      <div class="row"><span class="label">Payment Method</span><span class="val">${r.method}</span></div>
      <div class="total"><span>Total Paid</span><span>₹${r.amount.toLocaleString("en-IN")}</span></div>
      <p style="text-align:center;color:#aaa;font-size:11px;margin-top:30px">This is a computer-generated receipt.</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3a3f45", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Receipt size={22} style={{ color: ACCENT }} /> {isStudent ? "My Fee Receipts" : "Fee Receipts"}
        </h2>
        <p style={{ fontSize: "13px", color: VALUE, margin: 0 }}>
          {isStudent ? "Your payment receipts. Click download to print." : "All student payment receipts."}
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: "10px", boxShadow: CARD_SHADOW, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px", borderBottom: "1px solid #f0f1f4" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: VALUE }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search receipts..."
              style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: "6px", border: "1px solid #dee2e6", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: VALUE }}>
            <Loader2 size={26} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "14px" }}>Loading receipts...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#a0a6ad", fontSize: "14px" }}>
            No fee receipts found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "700px" }}>
              <thead>
                <tr style={{ background: "#fafbfe", color: LABEL }}>
                  <Th align="left">Receipt Date</Th>
                  <Th align="left">Receipt Number</Th>
                  {!isStudent && <Th align="left">Student</Th>}
                  <Th align="left">Payment Method</Th>
                  <Th align="right">Total</Th>
                  <Th>Download</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f0f1f4" }}>
                    <td style={{ padding: "13px 16px", color: "#3a3f45", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: "13px 16px", color: "#5a6169" }}>{r.receiptNumber}</td>
                    {!isStudent && <td style={{ padding: "13px 16px", color: "#5a6169" }}>{r.studentName}</td>}
                    <td style={{ padding: "13px 16px", color: "#5a6169" }}>{r.method}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right", fontWeight: 700, color: "#3a3f45" }}>₹{r.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "13px 16px", textAlign: "center" }}>
                      <button onClick={() => downloadReceipt(r)} title="Download receipt"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", background: "#eef0fe", border: "none", borderRadius: "6px", cursor: "pointer", color: ACCENT }}>
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, align = "center" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, textAlign: align, borderBottom: "2px solid #eef0f4", whiteSpace: "nowrap" }}>{children}</th>;
}
