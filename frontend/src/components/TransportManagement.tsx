import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import { Bus, Plus, MapPin, Trash2, Users2, Route } from "lucide-react";

export function TransportManagement() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"routes" | "vehicles">("routes");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: "", startPoint: "", endPoint: "", fee: "" });
  const [newVehicle, setNewVehicle] = useState({ number: "", type: "BUS", capacity: "40", driverName: "", driverPhone: "" });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [r, v, s] = await Promise.all([api.transport.getRoutes(), api.transport.getVehicles(), api.transport.getStats()]);
      if (r.data) setRoutes(r.data);
      if (v.data) setVehicles(v.data);
      if (s.data) setStats(s.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleCreateRoute = async () => {
    if (!newRoute.name || !newRoute.startPoint || !newRoute.endPoint) return;
    setCreating(true);
    try { await api.transport.createRoute(newRoute); setNewRoute({ name: "", startPoint: "", endPoint: "", fee: "" }); setShowCreate(false); loadData(); } catch (err) { console.error(err); }
    setCreating(false);
  };
  const handleCreateVehicle = async () => {
    if (!newVehicle.number) return;
    setCreating(true);
    try { await api.transport.createVehicle(newVehicle); setNewVehicle({ number: "", type: "BUS", capacity: "40", driverName: "", driverPhone: "" }); setShowCreate(false); loadData(); } catch (err) { console.error(err); }
    setCreating(false);
  };

  
  

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Transport Management</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Manage routes, vehicles, and student transport.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus size={14} />}>{activeTab === "routes" ? "Add Route" : "Add Vehicle"}</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Routes", value: stats.totalRoutes, icon: <Route size={18} />, color: "hsl(271,91%,60%)" },
            { label: "Vehicles", value: stats.totalVehicles, icon: <Bus size={18} />, color: "hsl(328,100%,54%)" },
            { label: "Stops", value: stats.totalStops, icon: <MapPin size={18} />, color: "hsl(142,70%,42%)" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
              <div><p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p><p style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>{s.value}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "var(--bg-secondary)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
        {(["routes", "vehicles"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 16px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "var(--color-accent)" : "var(--text-secondary)", boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.06)" : "none" }}>
            {tab === "routes" ? "Routes" : "Vehicles"}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{[1,2,3].map(i => <Skeleton key={i} variant="rect" height={70} />)}</div>
      ) : activeTab === "routes" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {routes.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}><Route size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} /><p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No routes configured.</p></div>
          ) : routes.map((route) => (
            <div key={route.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "hsla(271,91%,60%,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Route size={18} style={{ color: "hsl(271,91%,60%)" }} /></div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{route.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{route.startPoint} → {route.endPoint} · {route.stops?.length || 0} stops · ₹{Number(route.fee).toLocaleString("en-IN")}</p>
              </div>
              <button onClick={async () => { await api.transport.deleteRoute(route.id); loadData(); }} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", opacity: 0.5 }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {vehicles.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}><Bus size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} /><p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No vehicles added.</p></div>
          ) : vehicles.map((v) => (
            <div key={v.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "hsla(328,100%,54%,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bus size={18} style={{ color: "hsl(328,100%,54%)" }} /></div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{v.number}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{v.type} · Capacity: {v.capacity} · {v.driverName || "No driver"}</p>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: v.status === "ACTIVE" ? "var(--color-success)" : "var(--color-danger)", background: v.status === "ACTIVE" ? "hsla(142,70%,42%,0.08)" : "hsla(342,90%,48%,0.08)", padding: "3px 10px", borderRadius: "12px" }}>{v.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>{activeTab === "routes" ? "Add Route" : "Add Vehicle"}</h3>
            {activeTab === "routes" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div><label style={labelStyle}>Route Name *</label><input style={inputStyle} value={newRoute.name} onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })} placeholder="e.g. Route A" /></div>
                <div><label style={labelStyle}>Start Point *</label><input style={inputStyle} value={newRoute.startPoint} onChange={(e) => setNewRoute({ ...newRoute, startPoint: e.target.value })} placeholder="Starting location" /></div>
                <div><label style={labelStyle}>End Point *</label><input style={inputStyle} value={newRoute.endPoint} onChange={(e) => setNewRoute({ ...newRoute, endPoint: e.target.value })} placeholder="Destination" /></div>
                <div><label style={labelStyle}>Monthly Fee (₹)</label><input style={inputStyle} type="number" value={newRoute.fee} onChange={(e) => setNewRoute({ ...newRoute, fee: e.target.value })} placeholder="0" /></div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div><label style={labelStyle}>Vehicle Number *</label><input style={inputStyle} value={newVehicle.number} onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })} placeholder="e.g. MH 01 AB 1234" /></div>
                <div><label style={labelStyle}>Type</label><select style={inputStyle} value={newVehicle.type} onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}><option value="BUS">Bus</option><option value="VAN">Van</option><option value="CAR">Car</option><option value="AUTO">Auto</option></select></div>
                <div><label style={labelStyle}>Capacity</label><input style={inputStyle} type="number" value={newVehicle.capacity} onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })} /></div>
                <div><label style={labelStyle}>Driver Name</label><input style={inputStyle} value={newVehicle.driverName} onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })} /></div>
                <div><label style={labelStyle}>Driver Phone</label><input style={inputStyle} value={newVehicle.driverPhone} onChange={(e) => setNewVehicle({ ...newVehicle, driverPhone: e.target.value })} /></div>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" isLoading={creating} onClick={activeTab === "routes" ? handleCreateRoute : handleCreateVehicle} leftIcon={<Plus size={14} />}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
