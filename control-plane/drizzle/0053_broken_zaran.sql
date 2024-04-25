ALTER TABLE "services" ALTER COLUMN "definition" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "json_schema" json;--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN IF EXISTS "types";