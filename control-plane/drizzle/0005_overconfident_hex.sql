UPDATE "jobs" SET "owner_id" = 'fake_hash' WHERE "owner_id" IS NULL;--> statement-breakpoint

ALTER TABLE "jobs" RENAME COLUMN "owner_id" TO "owner_hash";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "owner_hash" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "owner_hash" SET NOT NULL;