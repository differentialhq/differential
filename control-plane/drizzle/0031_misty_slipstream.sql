CREATE TABLE IF NOT EXISTS "deployments" (
	"id" varchar(1024) PRIMARY KEY NOT NULL,
	"cluster_id" varchar NOT NULL,
	"service" varchar(1024) NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"package_upload_path" varchar(1024) NOT NULL,
	"definition_upload_url" varchar(1024) NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deployments" ADD CONSTRAINT "deployments_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
