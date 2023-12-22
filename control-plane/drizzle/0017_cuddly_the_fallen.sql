ALTER TABLE "clusters" ADD COLUMN "service_definition" json;--> statement-breakpoint
ALTER TABLE "clusters" DROP COLUMN IF EXISTS "wake_up_config";