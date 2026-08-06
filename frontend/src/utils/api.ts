const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

let authToken: string | null = localStorage.getItem("ecrm_token");

export const setToken = (token: string | null) => {
  authToken = token;
  if (token) localStorage.setItem("ecrm_token", token);
  else localStorage.removeItem("ecrm_token");
};

export const getToken = () => authToken;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (body: object) =>
      request<any>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    forgotPassword: (email: string) =>
      request<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) =>
      request<any>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
    verifyEmail: (token: string) =>
      request<any>(`/auth/verify/${token}`),
    resendVerification: (email: string) =>
      request<any>("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
    refresh: (refreshToken: string) =>
      request<any>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
    getProfile: () => request<any>("/auth/profile"),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<any>("/auth/change-password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) }),
    logoutAll: () => request<any>("/auth/logout-all", { method: "DELETE" }),
  },

  // ── Leads / Admissions CRM ──────────────────────────────
  leads: {
    getAll: (params?: { status?: string; source?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/leads${q ? `?${q}` : ""}`);
    },
    getById: (id: string) => request<any>(`/leads/${id}`),
    getStats: () => request<any>("/leads/stats"),
    create: (body: object) => request<any>("/leads", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/leads/${id}`, { method: "DELETE" }),
    getActivities: (id: string) => request<any>(`/leads/${id}/activities`),
    addActivity: (id: string, body: { type: string; content: string; metadata?: any }) =>
      request<any>(`/leads/${id}/activities`, { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Students ─────────────────────────────────────────────
  students: {
    getAll: () => request<any>("/students"),
    getOne: (id: string) => request<any>(`/students/${id}`),
    getProfile: (id: string) => request<any>(`/students/${id}/profile`),
    getStats: () => request<any>("/students/stats"),
    create: (body: object) => request<any>("/students", { method: "POST", body: JSON.stringify(body) }),
    bulkImport: (students: object[]) => request<any>("/students/bulk", { method: "POST", body: JSON.stringify({ students }) }),
    update: (id: string, body: object) => request<any>(`/students/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/students/${id}`, { method: "DELETE" }),
  },

  // ── WhatsApp ─────────────────────────────────────────────
  whatsapp: {
    getStatus: () => request<any>("/whatsapp/status"),
    getQR: () => request<any>("/whatsapp/qr"),
    restart: () => request<any>("/whatsapp/restart", { method: "POST" }),
    sendTest: (body: { phone: string; message: string }) => request<any>("/whatsapp/send-test", { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Staff ────────────────────────────────────────────────
  staff: {
    getAll: () => request<any>("/staff"),
    create: (body: object) => request<any>("/staff", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/staff/${id}`, { method: "DELETE" }),
  },

  // ── Attendance ───────────────────────────────────────────
  attendance: {
    getAll: (params?: { batch_id?: string; date?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/attendance${q ? `?${q}` : ""}`);
    },
    getSession: (params: { batch_id: string; date: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/attendance/session?${q}`);
    },
    submit: (body: object) => request<any>("/attendance", { method: "POST", body: JSON.stringify(body) }),
    mark: (body: {
      schedule_id: string;
      student_id: string;
      class_date: string;
      status: string;
      remarks?: string;
    }) => request<any>("/attendance/mark", { method: "POST", body: JSON.stringify(body) }),
    sync: (records: object[]) => request<any>("/attendance/sync", { method: "POST", body: JSON.stringify({ records }) }),
  },

  // ── Invoices ─────────────────────────────────────────────
  invoices: {
    getAll: () => request<any>("/invoices"),
    create: (body: object) => request<any>("/invoices", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    pay: (id: string, body: object) => request<any>(`/invoices/${id}/pay`, { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Batches ──────────────────────────────────────────────
  batches: {
    getAll: () => request<any>("/batches"),
    create: (body: object) => request<any>("/batches", { method: "POST", body: JSON.stringify(body) }),
    enroll: (batchId: string, studentId: string) =>
      request<any>(`/batches/${batchId}/enroll`, { method: "POST", body: JSON.stringify({ studentId }) }),
    delete: (id: string) => request<any>(`/batches/${id}`, { method: "DELETE" }),
  },

  // ── Organizations ──────────────────────────────────────────
  organizations: {
    getAll: () => request<any>("/organizations"),
    getById: (id: string) => request<any>(`/organizations/${id}`),
    create: (body: object) => request<any>("/organizations", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/organizations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    setup: (id: string, step: number, data: object) => request<any>(`/organizations/${id}/setup`, { method: "POST", body: JSON.stringify({ step, data }) }),
    invite: (id: string, email: string, roleSlug: string) => request<any>(`/organizations/${id}/invite`, { method: "POST", body: JSON.stringify({ email, roleSlug }) }),
  },

  // ── Roles & Permissions ────────────────────────────────────
  roles: {
    getAll: (orgId?: string) => request<any>(`/roles${orgId ? `?org_id=${orgId}` : ""}`),
    create: (body: object) => request<any>("/roles", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/roles/${id}`, { method: "DELETE" }),
    getPermissions: () => request<any>("/roles/permissions"),
    getMembers: (orgId?: string) => request<any>(`/roles/members${orgId ? `?org_id=${orgId}` : ""}`),
    updateMember: (id: string, body: object) => request<any>(`/roles/members/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  },

  // ── Subjects ─────────────────────────────────────────────
  subjects: {
    getAll: () => request<any>("/subjects"),
    create: (body: object) => request<any>("/subjects", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/subjects/${id}`, { method: "DELETE" }),
  },

  // ── Homework & Assignments ──────────────────────────────
  homework: {
    getAll: (params?: { batch_id?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/homework${q ? `?${q}` : ""}`);
    },
    getById: (id: string) => request<any>(`/homework/${id}`),
    getStats: () => request<any>("/homework/stats"),
    create: (body: object) => request<any>("/homework", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/homework/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/homework/${id}`, { method: "DELETE" }),
    submit: (id: string, body: object) => request<any>(`/homework/${id}/submit`, { method: "POST", body: JSON.stringify(body) }),
    grade: (id: string, body: object) => request<any>(`/homework/${id}/grade`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  // ── Transport ──────────────────────────────────────────
  transport: {
    getRoutes: () => request<any>("/transport/routes"),
    createRoute: (body: object) => request<any>("/transport/routes", { method: "POST", body: JSON.stringify(body) }),
    deleteRoute: (id: string) => request<any>(`/transport/routes/${id}`, { method: "DELETE" }),
    getVehicles: () => request<any>("/transport/vehicles"),
    createVehicle: (body: object) => request<any>("/transport/vehicles", { method: "POST", body: JSON.stringify(body) }),
    deleteVehicle: (id: string) => request<any>(`/transport/vehicles/${id}`, { method: "DELETE" }),
    getStats: () => request<any>("/transport/stats"),
  },

  // ── Library ────────────────────────────────────────────
  library: {
    getBooks: (params?: { search?: string; category?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/library/books${q ? `?${q}` : ""}`);
    },
    createBook: (body: object) => request<any>("/library/books", { method: "POST", body: JSON.stringify(body) }),
    deleteBook: (id: string) => request<any>(`/library/books/${id}`, { method: "DELETE" }),
    issueBook: (bookId: string, body: object) => request<any>(`/library/books/${bookId}/issue`, { method: "POST", body: JSON.stringify(body) }),
    returnBook: (issueId: string) => request<any>(`/library/issues/${issueId}/return`, { method: "POST" }),
    getIssues: (status?: string) => request<any>(`/library/issues${status ? `?status=${status}` : ""}`),
    getStats: () => request<any>("/library/stats"),
  },

  // ── Announcements / Communication ──────────────────────
  announcements: {
    getAll: (params?: { type?: string; audience?: string; active?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/announcements${q ? `?${q}` : ""}`);
    },
    create: (body: object) => request<any>("/announcements", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/announcements/${id}`, { method: "DELETE" }),
  },

  // ── Reports & Analytics ────────────────────────────────
  reports: {
    getOverview: () => request<any>("/reports/overview"),
    getAttendance: (params?: { batch_id?: string; days?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/reports/attendance${q ? `?${q}` : ""}`);
    },
    getFinance: () => request<any>("/reports/finance"),
  },

  // ── Settings & Configuration ───────────────────────────
  settings: {
    get: () => request<any>("/settings"),
    updateOrganization: (body: object) => request<any>("/settings/organization", { method: "PUT", body: JSON.stringify(body) }),
    addDepartment: (body: object) => request<any>("/settings/departments", { method: "POST", body: JSON.stringify(body) }),
    deleteDepartment: (id: string) => request<any>(`/settings/departments/${id}`, { method: "DELETE" }),
    addAcademicYear: (body: object) => request<any>("/settings/academic-years", { method: "POST", body: JSON.stringify(body) }),
  },
};
