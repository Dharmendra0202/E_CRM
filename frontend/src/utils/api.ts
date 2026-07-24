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
  },

  // ── Leads ───────────────────────────────────────────────
  leads: {
    getAll: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/leads${q ? `?${q}` : ""}`);
    },
    create: (body: object) => request<any>("/leads", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/leads/${id}`, { method: "DELETE" }),
  },

  // ── Students ─────────────────────────────────────────────
  students: {
    getAll: () => request<any>("/students"),
    getOne: (id: string) => request<any>(`/students/${id}`),
    create: (body: object) => request<any>("/students", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/students/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/students/${id}`, { method: "DELETE" }),
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
};
