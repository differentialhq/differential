ALTER TABLE "jobs" ADD CONSTRAINT "jobs_id_unique" UNIQUE("id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" varchar(1024) PRIMARY KEY NOT NULL,
	"cluster_id" varchar,
	"type" varchar(1024),
	"job_id" varchar(1024),
	"machine_id" varchar(1024),
	"service" varchar(1024),
	"created_at" timestamp with time zone NOT NULL,
	"meta" json
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;