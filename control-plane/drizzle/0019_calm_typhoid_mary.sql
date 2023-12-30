DROP TABLE "users";--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "service" varchar(1024);