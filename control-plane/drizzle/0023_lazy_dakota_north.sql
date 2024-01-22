ALTER TABLE "jobs" ALTER COLUMN "service" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "cache_key" varchar(1024);