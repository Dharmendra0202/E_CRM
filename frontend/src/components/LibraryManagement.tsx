import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { api } from "../utils/api"
import { inputStyle, labelStyle } from "../utils/styles";
import { BookOpen, Plus, Search, Trash2, RotateCcw, AlertCircle } from "lucide-react";

export function LibraryManagement() {
  const [books, setBooks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "issued">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddBook, setShowAddBook] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "", category: "", totalCopies: "1" });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (activeTab === "catalog") loadBooks(); }, [searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [b, i, s] = await Promise.all([api.library.getBooks(), api.library.getIssues("ISSUED"), api.library.getStats()]);
      if (b.data) setBooks(b.data);
      if (i.data) setIssues(i.data);
      if (s.data) setStats(s.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };
  const loadBooks = async () => {
    try { const res = await api.library.getBooks({ search: searchQuery || undefined }); if (res.data) setBooks(res.data); } catch (err) { console.error(err); }
  };

  const handleCreateBook = async () => {
    if (!newBook.title || !newBook.author) return;
    setCreating(true);
    try { await api.library.createBook({ ...newBook, totalCopies: parseInt(newBook.totalCopies) || 1 }); setNewBook({ title: "", author: "", isbn: "", category: "", totalCopies: "1" }); setShowAddBook(false); loadData(); } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleReturn = async (issueId: string) => {
    try { await api.library.returnBook(issueId); loadData(); } catch (err) { console.error(err); }
  };

  
  

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="text-gradient-indigo" style={{ margin: "0 0 6px" }}>Library Management</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Manage book catalog, issues, and returns.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddBook(true)} leftIcon={<Plus size={14} />}>Add Book</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total Books", value: stats.totalBooks, color: "hsl(271,91%,60%)" },
            { label: "Total Copies", value: stats.totalCopies, color: "hsl(328,100%,54%)" },
            { label: "Currently Issued", value: stats.issued, color: "hsl(38,92%,50%)" },
            { label: "Overdue", value: stats.overdue, color: "var(--color-danger)" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid var(--border-glass)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", padding: "4px", borderRadius: "12px" }}>
          {(["catalog", "issued"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 16px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "var(--color-accent)" : "var(--text-secondary)" }}>
              {tab === "catalog" ? "Catalog" : "Issued Books"}
            </button>
          ))}
        </div>
        {activeTab === "catalog" && (
          <div style={{ position: "relative", width: "260px" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input style={{ ...inputStyle, paddingLeft: "34px", fontSize: "12px" }} placeholder="Search books..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={60} />)}</div>
      ) : activeTab === "catalog" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {books.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}><BookOpen size={32} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "10px" }} /><p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No books in catalog.</p></div>
          ) : books.map((book) => (
            <div key={book.id} style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-glass)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{book.title}</p>
                <span style={{ fontSize: "10px", fontWeight: 700, color: book.availableCopies > 0 ? "var(--color-success)" : "var(--color-danger)", background: book.availableCopies > 0 ? "hsla(142,70%,42%,0.08)" : "hsla(342,90%,48%,0.08)", padding: "2px 8px", borderRadius: "10px" }}>
                  {book.availableCopies}/{book.totalCopies}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{book.author} {book.category ? `· ${book.category}` : ""}</p>
              {book.isbn && <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--text-secondary)" }}>ISBN: {book.isbn}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {issues.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid var(--border-glass)" }}><p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>No books currently issued.</p></div>
          ) : issues.map((issue) => {
            const isOverdue = new Date(issue.dueDate) < new Date();
            return (
              <div key={issue.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px 16px", border: `1px solid ${isOverdue ? "hsla(342,90%,48%,0.2)" : "var(--border-glass)"}`, display: "flex", alignItems: "center", gap: "12px" }}>
                <BookOpen size={16} style={{ color: isOverdue ? "var(--color-danger)" : "hsl(271,91%,60%)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{issue.book?.title}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>Due: {new Date(issue.dueDate).toLocaleDateString("en-IN")} {isOverdue && <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>· OVERDUE</span>}</p>
                </div>
                <button onClick={() => handleReturn(issue.id)} style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success)", background: "hsla(142,70%,42%,0.08)", border: "1px solid hsla(142,70%,42%,0.2)", padding: "5px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><RotateCcw size={12} /> Return</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBook && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowAddBook(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px" }} className="animate-slide-up">
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700 }}>Add Book</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} placeholder="Book title" /></div>
              <div><label style={labelStyle}>Author *</label><input style={inputStyle} value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} placeholder="Author name" /></div>
              <div><label style={labelStyle}>ISBN</label><input style={inputStyle} value={newBook.isbn} onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} placeholder="ISBN number" /></div>
              <div><label style={labelStyle}>Category</label><input style={inputStyle} value={newBook.category} onChange={(e) => setNewBook({ ...newBook, category: e.target.value })} placeholder="e.g. Science, Fiction" /></div>
              <div><label style={labelStyle}>Total Copies</label><input style={inputStyle} type="number" value={newBook.totalCopies} onChange={(e) => setNewBook({ ...newBook, totalCopies: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setShowAddBook(false)}>Cancel</Button>
              <Button variant="primary" isLoading={creating} onClick={handleCreateBook} leftIcon={<Plus size={14} />}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
