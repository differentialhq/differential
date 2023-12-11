ALTER TABLE "credentials" RENAME COLUMN "user_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "credentials" DROP COLUMN IF EXISTS "environment_id";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "environment_id";--> statement-breakpoint
ALTER TABLE "machines" DROP COLUMN IF EXISTS "environment_id";