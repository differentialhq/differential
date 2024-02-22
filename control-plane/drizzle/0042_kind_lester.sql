CREATE TABLE IF NOT EXISTS "asset_uploads" (
	"id" varchar(1024) PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"bucket" varchar(1024) NOT NULL,
	"key" varchar(1024) NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "asset_upload_id" varchar(1024) NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deployments" ADD CONSTRAINT "deployments_asset_upload_id_asset_uploads_id_fk" FOREIGN KEY ("asset_upload_id") REFERENCES "asset_uploads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN IF EXISTS "package_upload_path";--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN IF EXISTS "definition_upload_url";