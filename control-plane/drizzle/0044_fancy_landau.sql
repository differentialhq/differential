ALTER TABLE "jobs" DROP CONSTRAINT "jobs_owner_hash_target_fn_idempotency_key";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "idempotency_key";--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_owner_hash_target_fn_id" PRIMARY KEY("owner_hash","target_fn","id");