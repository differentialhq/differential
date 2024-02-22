ALTER TABLE "asset_uploads" ADD COLUMN "bucket" varchar(1024) NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_uploads" ADD COLUMN "key" varchar(1024) NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_uploads" DROP COLUMN IF EXISTS "package_upload_path";