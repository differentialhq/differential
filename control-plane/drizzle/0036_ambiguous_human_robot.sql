CREATE TABLE IF NOT EXISTS "deployment_notifications" (
	"id" varchar(1024) PRIMARY KEY NOT NULL,
	"deployment_id" varchar(1024) NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deployment_id" varchar(1024);--> statement-breakpoint
ALTER TABLE "machines" ADD COLUMN "deployment_id" varchar;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deployment_notifications" ADD CONSTRAINT "deployment_notifications_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
