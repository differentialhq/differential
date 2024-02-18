DELETE FROM "events";
DELETE FROM "machines";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_machine_id_machines_id_fk";

--> statement-breakpoint

ALTER TABLE "machines" DROP CONSTRAINT IF EXISTS "machines_pkey" CASCADE;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_machine_id_cluster_id_machines_id_cluster_id_fk" FOREIGN KEY ("machine_id","cluster_id") REFERENCES "machines"("id","cluster_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "machines" DROP CONSTRAINT IF EXISTS "machines_id_cluster_id" CASCADE;
ALTER TABLE "machines" ADD CONSTRAINT "machines_id_cluster_id" PRIMARY KEY("id","cluster_id");