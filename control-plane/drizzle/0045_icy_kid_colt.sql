UPDATE "jobs" SET "timeout_interval_seconds" = 3600 WHERE "timeout_interval_seconds" IS NULL;

ALTER TABLE "jobs" ALTER COLUMN "timeout_interval_seconds" SET DEFAULT 3600;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "timeout_interval_seconds" SET NOT NULL;