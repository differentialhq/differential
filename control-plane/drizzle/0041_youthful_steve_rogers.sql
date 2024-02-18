DELETE FROM "machines";
DELETE FROM "events";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_machine_id_machines_id_fk";

--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'machines'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

ALTER TABLE "machines" DROP CONSTRAINT IF EXISTS "machines_pkey" CASCADE;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_machine_id_cluster_id_machines_id_cluster_id_fk" FOREIGN KEY ("machine_id","cluster_id") REFERENCES "machines"("id","cluster_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "machines" DROP CONSTRAINT IF EXISTS "machines_id_cluster_id" CASCADE;
ALTER TABLE "machines" ADD CONSTRAINT "machines_id_cluster_id" PRIMARY KEY("id","cluster_id");