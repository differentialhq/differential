ALTER TABLE "jobs" ADD COLUMN "executing_machine_id" text;--> statement-breakpoint
ALTER TABLE "machines" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "machine_type";