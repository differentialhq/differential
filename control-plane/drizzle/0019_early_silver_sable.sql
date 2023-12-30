DROP TABLE "users";--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "resulted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "function_execution_time_ms" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "service" varchar(1024);
