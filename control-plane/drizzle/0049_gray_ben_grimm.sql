ALTER TABLE "jobs" DROP CONSTRAINT "jobs_owner_hash_target_fn_id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx1" ON "jobs" ("owner_hash","service","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx2" ON "jobs" ("owner_hash","service","target_fn","status");--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_owner_hash_id" PRIMARY KEY("owner_hash","id");