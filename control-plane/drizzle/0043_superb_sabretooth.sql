ALTER TABLE "client_uploads" RENAME TO "asset_uploads";--> statement-breakpoint
ALTER TABLE "asset_uploads" RENAME COLUMN "client_upload_path" TO "package_upload_path";--> statement-breakpoint
ALTER TABLE "asset_uploads" ADD COLUMN "type" text NOT NULL;