-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "consent_accepted_at" DATETIME;
ALTER TABLE "bookings" ADD COLUMN "consent_policy_version" TEXT;
