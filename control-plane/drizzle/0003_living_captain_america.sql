ALTER TABLE "jobs" ADD COLUMN "result_type" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "remaining" integer DEFAULT 1;