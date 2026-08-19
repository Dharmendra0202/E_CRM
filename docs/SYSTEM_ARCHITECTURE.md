# E-CRM Educational Management System — Complete Architecture Document

## Overview

E-CRM is a full-stack Educational CRM/ERP system for coaching institutes, schools, and academies. It manages student enrollment, attendance, fees, examinations, marksheets, timetables, staff/teachers, and communications.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (hosted on Supabase, Mumbai region) |
| ORM | Prisma |
| Auth | Custom JWT (access + refresh tokens) + Google OAuth |
| Real-time | Socket.IO (for live attendance updates) |
| Email | Resend API |
| Hosting | Vercel (frontend) + Render (backend) + Supabase (DB) |

---

## Project Structure

```
E-CRM/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── App.tsx             # Main app shell, routing (state-based), header, sidebar
│   │   ├── main.tsx            # Entry point
│   │   ├── main.css            # Global styles
│   │   ├── components/
│   │   │   ├── ui/             # Reusable UI (Button, Card, Sidebar, CommandPalette, etc.)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── NewEnrollment.tsx
│   │   │   ├── StudentManagement.tsx
│   │   │   ├── StudentProfile.tsx
│   │   │   ├── AdmissionsCRM.tsx
│   │   │   ├── AttendanceTracker.tsx
│   │   │   ├── FeeManagement.tsx
│   │   │   ├── TimetableScheduler.tsx
│   │   │   ├── ExaminationSystem.tsx
│   │   │   ├── MarksheetSystem.tsx
│   │   │   ├── ExamsManagement.tsx (Report Cards)
│   │   │   ├── HomeworkAssignments.tsx
│   │   │   ├── BulkPromotion.tsx
│   │   │   ├── WeakStudentModule.tsx
│   │   │   ├── OnlineAdmissions.tsx (Coming Soon)
│   │   │   ├── ParentManagement.tsx
│   │   │   ├── TransportManagement.tsx
│   │   │   ├── LibraryManagement.tsx
│   │   │   ├── CommunicationCenter.tsx
│   │   │   ├── ReportsAnalytics.tsx
│   │   │   ├── UserRoleManagement.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── AcademicManagement.tsx
│   │   │   ├── BatchesManagement.tsx
│   │   │   ├── OnboardingWizard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   └── HistoryModal.tsx
│   │   ├── utils/
│   │   │   ├── api.ts          # All API endpoints (centralized)
│   │   │   ├── exportExcel.ts  # Excel export helpers
│   │   │   ├── history.ts
│   │   │   └── supabaseClient.ts
│   │   └── pages/
│   │       ├── ResetPassword.tsx
│   │       └── VerifyEmail.tsx
│   └── package.json
│
├── backend/                     # Express + Prisma
│   ├── src/
│   │   ├── server.ts           # Express app, middleware, route mounting
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authentication + role authorization
│   │   │   └── security.ts    # XSS sanitization, security headers, request IDs
│   │   ├── routes/
│   │   │   ├── auth.ts         # Login, register, Google OAuth, password reset, set-role
│   │   │   ├── students.ts     # CRUD + enrollment + profile + stats
│   │   │   ├── staff.ts        # Staff CRUD + all-users endpoint
│   │   │   ├── attendance.ts   # Session loading + mark + submit
│   │   │   ├── invoices.ts     # Fee invoices + approval workflow + payments
│   │   │   ├── batches.ts      # Batch CRUD + enrollment
│   │   │   ├── schedules.ts    # Timetable schedules
│   │   │   ├── leads.ts        # Admissions CRM pipeline
│   │   │   ├── exams.ts        # Examination CRUD + results
│   │   │   ├── marksheets.ts   # Marksheet entries + aggregated results
│   │   │   ├── homework.ts     # Assignments CRUD + submissions
│   │   │   ├── subjects.ts     # Subject management
│   │   │   ├── transport.ts    # Routes + vehicles
│   │   │   ├── library.ts      # Books + issues + returns
│   │   │   ├── announcements.ts # Communication center
│   │   │   ├── notifications.ts # Notification center
│   │   │   ├── organizations.ts # Multi-tenant org setup
│   │   │   ├── roles.ts        # RBAC roles + permissions
│   │   │   ├── reports.ts      # Analytics overview
│   │   │   └── settings.ts     # System settings
│   │   └── utils/
│   │       ├── prisma.ts       # Prisma client singleton
│   │       ├── auditLog.ts     # Audit logging utility
│   │       ├── email.ts        # Email templates (Resend)
│   │       └── logger.ts       # Winston logger
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (33 tables)
│   └── package.json
│
└── docs/                        # Documentation
```

---

## Database Schema (33 Tables)

### Core Models
| Table | Purpose |
|-------|---------|
| User | All login accounts (admin, teacher, staff, student, parent) |
| Student | Student profile linked to User (parent details, DOB, gender, address) |
| Teacher | Teacher profile (qualification, hourly rate) |
| Batch | Classes/batches (1st-12th Standard, Science PCM/PCB/PCMB, Commerce SP/Maths) |
| BatchEnrollment | Which student is in which batch (many-to-many) |
| Schedule | Timetable entries (day, time, room) |
| Attendance | Per-student per-date attendance records |

### Financial Models
| Table | Purpose |
|-------|---------|
| Invoice | Fee invoices (amount, due date, status: UNPAID/VERIFIED/APPROVED/PARTIAL/PAID) |
| Payment | Payment records (amount, method, reference) |

### Academic Models
| Table | Purpose |
|-------|---------|
| Subject | Academic subjects |
| Homework | Assignments with due dates |
| HomeworkSubmission | Student submissions with grades |
| Exam | Examination records (lifecycle: DRAFT→SCHEDULED→CONDUCTED→EVALUATED→PUBLISHED) |
| ExamResult | Per-student marks per exam |
| MarksheetEntry | Subject-wise marks with auto-calculated percentage/grade |

### CRM Models
| Table | Purpose |
|-------|---------|
| Lead | Enquiry/admission pipeline (NEW→CONTACTED→COUNSELLING→ENROLLED) |
| LeadActivity | Timeline of actions on each lead |

### Organization Models
| Table | Purpose |
|-------|---------|
| Organization | Institute details (multi-tenant support) |
| Campus | Multiple campus support |
| Department | Academic departments |
| AcademicYear | Session management (2025-26, 2026-27) |

### RBAC Models
| Table | Purpose |
|-------|---------|
| Role | Role definitions (Super Admin, Teacher, Student, etc.) |
| Permission | Module+action permissions (students.create, fees.approve) |
| RolePermission | Role-to-permission mapping |
| OrgMember | User-to-organization-to-role linking |

### Utility Models
| Table | Purpose |
|-------|---------|
| TransportRoute | Bus/van routes |
| TransportStop | Stops on routes |
| Vehicle | Fleet vehicles |
| Book | Library catalog |
| BookIssue | Book issue/return tracking |
| Announcement | Notices and communications |
| Notification | Per-user notifications (read/unread) |
| AuditLog | All system actions logged (create/update/delete/login/logout) |

### Key Fields on Models
- `deletedAt` / `deletedBy` — Soft delete (on Student, Lead, Invoice, Batch, Homework, Announcement, Subject, TransportRoute)
- `updatedAt` — Auto-updated timestamp (on Student, Lead, Batch, Invoice, Announcement)
- `createdAt` — Creation timestamp (on all models)

---

## Authentication System

### Login Methods
1. **Email + Password** — Register, verify email (auto-verified for testing), login
2. **Google OAuth** — Login with Google, first-time users select role (Student/Teacher/Staff)

### JWT Tokens
- Access token: 15 minute expiry
- Refresh token: 7 day expiry, stored in DB, single-use rotation
- Server fails to start if `JWT_SECRET` env var is missing

### Security Features
- Account lockout after 5 failed login attempts (15 min)
- Password: min 8 chars, 1 uppercase, 1 number (Zod validation)
- Bcrypt with 12 rounds
- Anti-enumeration on forgot-password
- Auto-logout on 401 (frontend clears token + reloads)

---

## Role-Based Access Control (RBAC)

### Roles
| Role | Access Level |
|------|-------------|
| SUPER_ADMIN / ADMIN | Full access to all modules |
| TEACHER | Dashboard, Students (read), Batches, Timetable, Attendance, Homework, Exams, Marksheet, Communication |
| STAFF | Dashboard, Students (read), Attendance, Fees, Communication, Library, Transport |
| STUDENT | Dashboard, Timetable, Attendance, Exams, Marksheet, Homework, Fees (own only) |
| PARENT | Dashboard, Attendance, Exams, Marksheet, Fees, Communication |
| ACCOUNTANT | Dashboard, Fees, Reports |
| PENDING | Dashboard only (newly registered via Google, awaiting role selection) |

### Implementation
- **Sidebar** — Filters navigation items based on user's role (`ROLE_VIEWS` map in Sidebar.tsx)
- **Dashboard** — Shows different KPI cards, module cards, and sections per role
- **Backend APIs** — Protected with `authorize("ADMIN", "TEACHER")` middleware per route
- **Google OAuth** — New users get `PENDING` role, shown role selection screen, then assigned

---

## Workflows

### 1. Student Enrollment Flow
```
Admin clicks "New Enrollment" in sidebar
→ Step 1: Select role (Student/Staff/Teacher)
→ Step 2: Personal details (name, phone, gender, DOB, email, address, batch)
→ Step 3: Guardian details (father name/phone, mother name/phone) [students only]
→ Step 4: Fee structure (amount, payment plan: single/2/4/custom installments) [students only]
→ Submit
→ Backend creates: User (STUDENT role) + Student + BatchEnrollment + Invoice + Payment (if paid today)
→ Onboarding email sent
→ Student appears in Students section
```

### 2. Attendance Flow
```
Admin/Teacher goes to Attendance
→ Select batch from dropdown (only real DB batches shown)
→ Select date
→ Backend loads enrolled students for that batch
→ Auto-creates Schedule if batch has none
→ Mark each student: Present / Absent / Late
→ Add optional remarks
→ Click "Save & Notify"
→ Records saved to Attendance table
→ If absent students + notify checked → opens WhatsApp to parent
```

### 3. Fee Management Flow
```
Invoice created during enrollment (or manually via "Issue Invoice")
→ Status: UNPAID
→ Optional approval workflow: UNPAID → VERIFIED → APPROVED → PAID
→ Admin clicks "Pay" → Record Payment modal
→ Enter amount, method (Cash/UPI/Card), reference
→ Payment record created
→ Invoice status updated (PARTIAL if partial, PAID if full)
→ Audit log generated
```

### 4. Examination Flow
```
Create Exam (title, type, subject, batch, date, marks)
→ Status: DRAFT
→ Advance: DRAFT → SCHEDULED → CONDUCTED → EVALUATED → PUBLISHED
→ Add results per student (marks, grade)
→ All persisted to PostgreSQL (not localStorage)
```

### 5. Marksheet Flow
```
Select batch → Select student → Enter subject marks
→ Auto-calculates: percentage, grade (A+/A/B+/B/C/D/F), rank
→ Results table shows all students sorted by rank
→ Persisted to PostgreSQL
```

### 6. Admissions CRM Flow
```
New Enquiry → Lead created (name, email, phone, source, notes)
→ Pipeline: NEW → CONTACTED → COUNSELLING → FOLLOW_UP → APPLICATION → ADMITTED → FEE_PAID → ENROLLED
→ Activity timeline (notes, status changes, calls)
→ "Direct Enrollment" button → auto-creates student from lead data
→ Lead status set to ENROLLED
```

### 7. Bulk Promotion Flow
```
Select source batch (e.g., "9th Standard")
→ Select target batch (e.g., "10th Standard")
→ Check students to promote (select all / individual)
→ Click "Promote"
→ BatchEnrollment created in target batch for each selected student
```

### 8. Google Auth + Role Selection Flow
```
User clicks "Continue with Google"
→ Google token verified
→ If existing user → login directly with existing role
→ If new user → create with role "PENDING"
→ Show role selection screen (Student / Teacher / Staff)
→ User picks role → POST /auth/set-role → role assigned → JWT issued → logged in
```

---

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /register | Create account |
| POST | /login | Login (returns JWT) |
| POST | /google | Google OAuth login |
| POST | /set-role | Assign role to PENDING user |
| GET | /verify/:token | Verify email |
| POST | /forgot-password | Request reset |
| POST | /reset-password | Set new password |
| POST | /refresh | Refresh access token |
| GET | /profile | Get current user |
| PUT | /change-password | Change password |
| DELETE | /logout-all | Invalidate all sessions |

### Students (`/api/v1/students`)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | / | List all (non-deleted) | ADMIN, TEACHER |
| GET | /:id | Single student | Authenticated |
| GET | /:id/profile | Full profile with stats | Authenticated |
| GET | /stats | Overview statistics | ADMIN, TEACHER |
| POST | / | Create (enrollment) | ADMIN |
| POST | /bulk | Bulk import | ADMIN |
| PATCH | /:id | Update | ADMIN |
| DELETE | /:id | Soft delete | ADMIN |

### Invoices (`/api/v1/invoices`)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | / | List all | Authenticated |
| POST | / | Create invoice | ADMIN |
| PATCH | /:id | Update | ADMIN |
| POST | /:id/approve | Advance status workflow | ADMIN |
| POST | /:id/pay | Record payment | ADMIN |

### Attendance (`/api/v1/attendance`)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | / | List records | Authenticated |
| GET | /session | Load batch session | ADMIN, TEACHER |
| POST | / | Bulk submit | ADMIN, TEACHER |
| POST | /mark | Mark single | ADMIN, TEACHER |
| POST | /sync | Sync from mobile | ADMIN, TEACHER |

### Exams (`/api/v1/exams`)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | / | List exams | Authenticated |
| POST | / | Create exam | ADMIN, TEACHER |
| PATCH | /:id | Update/advance status | ADMIN, TEACHER |
| DELETE | /:id | Soft delete | ADMIN |
| POST | /:id/results | Add student results | ADMIN, TEACHER |

### Marksheets (`/api/v1/marksheets`)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | / | List entries | Authenticated |
| POST | / | Add marks | ADMIN, TEACHER |
| DELETE | /:id | Delete entry | ADMIN |
| GET | /results | Aggregated results by batch | Authenticated |

### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | / | User's notifications + unread count | Authenticated |
| POST | / | Create notification | Authenticated |
| POST | /bulk | Send to multiple users | Authenticated |
| PATCH | /:id/read | Mark as read | Authenticated |
| POST | /read-all | Mark all read | Authenticated |
| DELETE | /:id | Delete | Authenticated |

### Other Endpoints
- `/api/v1/staff` — Staff CRUD + all-users export
- `/api/v1/batches` — Batch CRUD + student enrollment
- `/api/v1/schedules` — Timetable CRUD
- `/api/v1/leads` — Admissions CRM pipeline
- `/api/v1/homework` — Assignments CRUD + submissions + grading
- `/api/v1/subjects` — Subject management
- `/api/v1/transport` — Routes + vehicles
- `/api/v1/library` — Books + issue/return
- `/api/v1/announcements` — Communication center
- `/api/v1/organizations` — Multi-tenant management
- `/api/v1/roles` — RBAC management
- `/api/v1/reports` — Analytics overview
- `/api/v1/settings` — System configuration

---

## Batch Options (20 total)

| Standard | Batches |
|----------|---------|
| 1st - 10th | 1st Standard, 2nd Standard, ..., 10th Standard |
| 11th Science | 11th Science (PCM), 11th Science (PCB), 11th Science (PCMB) |
| 11th Commerce | 11th Commerce (SP), 11th Commerce (Maths) |
| 12th Science | 12th Science (PCM), 12th Science (PCB), 12th Science (PCMB) |
| 12th Commerce | 12th Commerce (SP), 12th Commerce (Maths) |

---

## Security Measures

| Measure | Status |
|---------|--------|
| CORS whitelist (env-based) | ✅ Active |
| Helmet security headers | ✅ Active |
| Rate limiting (500/15min general, 20/15min auth) | ✅ Active |
| XSS sanitization (strips script tags) | ✅ Active |
| SQL Injection protection (Prisma parameterized queries) | ✅ Active |
| JWT with no fallback secret | ✅ Active |
| Account lockout (5 attempts → 15min lock) | ✅ Active |
| Supabase RLS enabled on all tables | ✅ Active |
| Soft deletes (financial records never hard-deleted) | ✅ Active |
| Audit logging on key actions | ✅ Active |
| Google OAuth → STUDENT default (not ADMIN) | ✅ Fixed |

---

## Audit Log System

Tracks these actions across the system:
- CREATE, UPDATE, DELETE, APPROVE, REJECT, REVERT, LOGIN, LOGOUT

Stores: userId, userEmail, module, action, entityId, previousValue, newValue, ipAddress, userAgent, timestamp

Integrated in: students (create/delete), leads (delete), invoices (create/update/approve/pay), exams (create/update/delete), marksheets (create), auth (login/logout)

---

## Frontend Routing (State-Based)

Navigation is managed via `currentView` state in App.tsx. No React Router (no URL-based deep linking).

Views: dashboard, leads, new-enrollment, online-admissions, bulk-promotion, examination, marksheet, weak-students, admissions, parents, schedule, billing, staff, teachers, attendance, exams, academics, batches, homework, transport, library, communication, reports, roles, settings, onboarding

---

## Real-Time Features

- **Socket.IO** for live attendance updates (batch-based rooms)
- **WebSocket hook** (`useAttendanceRealtime`) in AttendanceTracker
- Dashboard data refreshes on each view switch

---

## Environment Variables Required

### Backend (.env)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=<strong random string>
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev
APP_URL=http://localhost:5173
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_CLIENT_ID=<from Google Cloud Console>
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_CLIENT_ID=<from Google Cloud Console>
```

---

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Frontend | Vercel | Root: `frontend`, Framework: Vite |
| Backend | Render | Root: `backend`, Build: `npm install && npx prisma generate && npm run build`, Start: `npm start` |
| Database | Supabase | PostgreSQL, ap-south-1 (Mumbai), RLS enabled |

---

## What's NOT Yet Built (Future Phases)

- Student/Parent separate portal pages (basic role filtering done, but no dedicated portal UI)
- Staff/Teacher attendance & leave management
- Salary/Payroll management
- QR attendance / Face recognition
- SMS fee receipts (WhatsApp exists partially)
- Transaction reversal workflow
- PDF generation (marksheets, receipts)
- MCQ/Practice test engine for weak students
- React Router (URL-based navigation)
- React Query (caching layer)
- Code splitting / lazy loading
- Bulk import (CSV/Excel)
- Document management (uploads)

---

## How to Run Locally

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

---

## Default Credentials

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | hemant150604@gmail.com | (your password) | ADMIN |
| Students created via enrollment | auto-generated | Student@123 | STUDENT |
| Staff created via enrollment | auto-generated | Staff@123 | STAFF/TEACHER |

---

*Last updated: August 2026*
