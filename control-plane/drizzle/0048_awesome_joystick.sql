ALTER TABLE "jobs" ALTER COLUMN "timeout_interval_seconds" SET DEFAULT 300;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "predictive_retry_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "clusters" DROP COLUMN IF EXISTS "retry_on_stall_enabled";