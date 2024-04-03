CREATE TABLE IF NOT EXISTS "cluster_access_points" (
	"cluster_id" varchar NOT NULL,
	"name" varchar(1024) NOT NULL,
	"allowed_services_csv" text NOT NULL,
	"token" varchar(1024) NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cluster_access_points" ADD CONSTRAINT "cluster_access_points_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
