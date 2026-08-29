-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "public_token" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduled_date" DATETIME NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "total_price" DECIMAL,
    "total_duration_minutes" INTEGER NOT NULL,
    "notes" TEXT,
    "service_location" TEXT NOT NULL DEFAULT 'SPA',
    "address" TEXT,
    "consent_accepted_at" DATETIME,
    "consent_policy_version" TEXT,
    "source" TEXT NOT NULL DEFAULT 'PUBLIC_WEB',
    "idempotency_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("client_id", "consent_accepted_at", "consent_policy_version", "created_at", "end_time", "id", "idempotency_key", "notes", "public_token", "scheduled_date", "source", "staff_id", "start_time", "status", "total_duration_minutes", "total_price", "updated_at") SELECT "client_id", "consent_accepted_at", "consent_policy_version", "created_at", "end_time", "id", "idempotency_key", "notes", "public_token", "scheduled_date", "source", "staff_id", "start_time", "status", "total_duration_minutes", "total_price", "updated_at" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE UNIQUE INDEX "bookings_public_token_key" ON "bookings"("public_token");
CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings"("idempotency_key");
CREATE INDEX "bookings_scheduled_date_start_time_idx" ON "bookings"("scheduled_date", "start_time");
CREATE INDEX "bookings_staff_id_scheduled_date_idx" ON "bookings"("staff_id", "scheduled_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
