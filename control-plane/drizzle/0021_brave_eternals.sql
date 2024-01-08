CREATE TABLE IF NOT EXISTS "services" (
	"cluster_id" varchar NOT NULL,
	"machine_id" varchar NOT NULL,
	"service" varchar(1024) NOT NULL,
	"definition" json NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
