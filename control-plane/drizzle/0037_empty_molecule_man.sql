ALTER TABLE "events" ADD COLUMN "deployment_id" varchar(1024);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
