ALTER TABLE "jobs" RENAME COLUMN "remaining" TO "remaining_attempts";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "timeout_interval" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "last_retrieved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "timed_out_at";