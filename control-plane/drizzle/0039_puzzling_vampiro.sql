ALTER TABLE "jobs" ALTER COLUMN "remaining_attempts" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "remaining_attempts" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clusters" ADD COLUMN "retry_on_stall_enabled" boolean DEFAULT true NOT NULL;