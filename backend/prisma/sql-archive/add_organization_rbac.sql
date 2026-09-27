-- Phase 3 & 4: Organization Onboarding + RBAC Models
-- Run: psql $DATABASE_URL -f backend/prisma/migrations/add_organization_rbac.sql

-- ═══════════════════════════════════════════════════════════════
-- ORGANIZATION & MULTI-TENANT TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COACHING',
    "logo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "language" TEXT NOT NULL DEFAULT 'en',
    "setupComplete" BOOLEAN NOT NULL DEFAULT false,
    "setupStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");

CREATE TABLE IF NOT EXISTS "Campus" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Campus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "Campus_organizationId_idx" ON "Campus"("organizationId");

CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "headUserId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "Department_organizationId_idx" ON "Department"("organizationId");

CREATE TABLE IF NOT EXISTS "AcademicYear" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AcademicYear_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "AcademicYear_organizationId_idx" ON "AcademicYear"("organizationId");

-- ═══════════════════════════════════════════════════════════════
-- ROLE & PERMISSION TABLES (RBAC)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "Role_organizationId_slug_key" ON "Role"("organizationId", "slug");
CREATE INDEX IF NOT EXISTS "Role_organizationId_idx" ON "Role"("organizationId");

CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Permission_module_action_key" ON "Permission"("module", "action");

CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

CREATE TABLE IF NOT EXISTS "OrgMember" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "OrgMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "OrgMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrgMember_userId_organizationId_key" ON "OrgMember"("userId", "organizationId");
CREATE INDEX IF NOT EXISTS "OrgMember_organizationId_idx" ON "OrgMember"("organizationId");
CREATE INDEX IF NOT EXISTS "OrgMember_userId_idx" ON "OrgMember"("userId");

-- ═══════════════════════════════════════════════════════════════
-- SEED DEFAULT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO "Permission" ("id", "module", "action", "description") VALUES
  ((gen_random_uuid())::text, 'students', 'create', 'Create students'),
  ((gen_random_uuid())::text, 'students', 'read', 'View students'),
  ((gen_random_uuid())::text, 'students', 'update', 'Edit students'),
  ((gen_random_uuid())::text, 'students', 'delete', 'Delete students'),
  ((gen_random_uuid())::text, 'attendance', 'create', 'Mark attendance'),
  ((gen_random_uuid())::text, 'attendance', 'read', 'View attendance'),
  ((gen_random_uuid())::text, 'attendance', 'update', 'Edit attendance'),
  ((gen_random_uuid())::text, 'fees', 'create', 'Create invoices'),
  ((gen_random_uuid())::text, 'fees', 'read', 'View invoices'),
  ((gen_random_uuid())::text, 'fees', 'update', 'Edit invoices'),
  ((gen_random_uuid())::text, 'fees', 'delete', 'Delete invoices'),
  ((gen_random_uuid())::text, 'academics', 'create', 'Create courses/batches'),
  ((gen_random_uuid())::text, 'academics', 'read', 'View courses/batches'),
  ((gen_random_uuid())::text, 'academics', 'update', 'Edit courses/batches'),
  ((gen_random_uuid())::text, 'academics', 'delete', 'Delete courses/batches'),
  ((gen_random_uuid())::text, 'staff', 'create', 'Add staff members'),
  ((gen_random_uuid())::text, 'staff', 'read', 'View staff'),
  ((gen_random_uuid())::text, 'staff', 'update', 'Edit staff'),
  ((gen_random_uuid())::text, 'staff', 'delete', 'Remove staff'),
  ((gen_random_uuid())::text, 'reports', 'read', 'View reports'),
  ((gen_random_uuid())::text, 'reports', 'export', 'Export reports'),
  ((gen_random_uuid())::text, 'settings', 'read', 'View settings'),
  ((gen_random_uuid())::text, 'settings', 'update', 'Modify settings'),
  ((gen_random_uuid())::text, 'communication', 'create', 'Send messages'),
  ((gen_random_uuid())::text, 'communication', 'read', 'View messages')
ON CONFLICT ("module", "action") DO NOTHING;
