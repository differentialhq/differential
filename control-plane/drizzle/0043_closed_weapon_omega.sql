CREATE TABLE IF NOT EXISTS "client_library_versions" (
	"id" varchar(1024) NOT NULL,
	"cluster_id" varchar NOT NULL,
	"version" varchar(1024) NOT NULL,
	"asset_upload_id" varchar(1024),
	CONSTRAINT client_library_versions_cluster_id_id PRIMARY KEY("cluster_id","id")
);
--> statement-breakpoint
ALTER TABLE "deployments" ALTER COLUMN "asset_upload_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_library_versions" ADD CONSTRAINT "client_library_versions_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_library_versions" ADD CONSTRAINT "client_library_versions_asset_upload_id_asset_uploads_id_fk" FOREIGN KEY ("asset_upload_id") REFERENCES "asset_uploads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
