ALTER TABLE "deployments" ADD COLUMN "asset_upload_id" varchar(1024) NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deployments" ADD CONSTRAINT "deployments_asset_upload_id_asset_uploads_id_fk" FOREIGN KEY ("asset_upload_id") REFERENCES "asset_uploads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN IF EXISTS "package_upload_path";