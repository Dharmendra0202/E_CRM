-- Phase 12-14: Transport, Library, Communication Center

-- ═══ TRANSPORT ═══
CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BUS',
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "insuranceExpiry" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_number_key" ON "Vehicle"("number");

CREATE TABLE IF NOT EXISTS "TransportRoute" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "distance" TEXT,
    "vehicleId" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TransportRoute_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "TransportRoute_status_idx" ON "TransportRoute"("status");

CREATE TABLE IF NOT EXISTS "TransportStop" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pickupTime" TEXT,
    "dropTime" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TransportStop_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TransportStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "TransportStop_routeId_idx" ON "TransportStop"("routeId");

-- ═══ LIBRARY ═══
CREATE TABLE IF NOT EXISTS "Book" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "publisher" TEXT,
    "category" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "shelfLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Book_isbn_key" ON "Book"("isbn");

CREATE TABLE IF NOT EXISTS "BookIssue" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "bookId" TEXT NOT NULL,
    "issuedTo" TEXT NOT NULL,
    "issuedBy" TEXT,
    "issueDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE NOT NULL,
    "returnDate" TIMESTAMPTZ(6),
    "fine" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    CONSTRAINT "BookIssue_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BookIssue_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "BookIssue_bookId_idx" ON "BookIssue"("bookId");
CREATE INDEX IF NOT EXISTS "BookIssue_issuedTo_idx" ON "BookIssue"("issuedTo");
CREATE INDEX IF NOT EXISTS "BookIssue_status_idx" ON "BookIssue"("status");

-- ═══ COMMUNICATION ═══
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "batchId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "publishedBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Announcement_type_isActive_idx" ON "Announcement"("type", "isActive");
CREATE INDEX IF NOT EXISTS "Announcement_audience_idx" ON "Announcement"("audience");
