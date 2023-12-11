ALTER TABLE "jobs" ALTER COLUMN "id" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "target_fn" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "idempotency_key" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "machines" ALTER COLUMN "id" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "machines" ALTER COLUMN "description" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "machines" ALTER COLUMN "class" SET DATA TYPE varchar(1024);