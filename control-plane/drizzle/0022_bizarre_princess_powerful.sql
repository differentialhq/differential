ALTER TABLE "services" DROP CONSTRAINT "services_machine_id_machines_id_fk";
--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN IF EXISTS "machine_id";--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_cluster_id_service" PRIMARY KEY("cluster_id","service");