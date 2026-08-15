import React from "react";
import { Smartphone, Upload, CreditCard, ShieldCheck } from "lucide-react";

export function OnlineAdmissions() {
  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "40px" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, hsl(271,91%,60%), hsl(328,100%,54%))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: "0 12px 32px hsla(271,91%,60%,0.3)" }}>
        <Smartphone size={36} color="#fff" />
      </div>
      <h1 style={{ margin: "0 0 10px", fontSize: "28px", fontWeight: 800, color: "hsl(285,50%,12%)" }}>Online Admissions</h1>
      <p style={{ margin: "0 0 32px", fontSize: "15px", color: "hsl(285,20%,50%)", maxWidth: "480px" }}>
        This module is coming soon. Students and parents will be able to apply online, upload documents, and pay fees directly from their mobile devices.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", maxWidth: "500px", width: "100%" }}>
        {[
          { icon: <Smartphone size={22} />, title: "Mobile App Admissions", desc: "Apply from anywhere" },
          { icon: <Upload size={22} />, title: "Document Upload", desc: "ID, marksheet, photos" },
          { icon: <ShieldCheck size={22} />, title: "Online Verification", desc: "Real-time validation" },
          { icon: <CreditCard size={22} />, title: "Online Fee Payment", desc: "UPI, Cards, Net Banking" },
        ].map((item, i) => (
          <div key={i} style={{ padding: "18px", borderRadius: "14px", background: "#fff", border: "1px solid hsla(285,30%,20%,0.08)", textAlign: "left" }}>
            <div style={{ color: "hsl(271,91%,60%)", marginBottom: "10px" }}>{item.icon}</div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "hsl(285,50%,12%)" }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "hsl(285,20%,55%)" }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px", padding: "12px 24px", borderRadius: "12px", background: "hsla(271,91%,60%,0.06)", border: "1px solid hsla(271,91%,60%,0.15)" }}>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "hsl(271,91%,60%)" }}>
          Expected in next release — Mobile App integration phase
        </p>
      </div>
    </div>
  );
}
