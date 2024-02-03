CREATE TABLE IF NOT EXISTS "deployment_provider_config" (
	"provider" varchar(1024) PRIMARY KEY NOT NULL,
	"config" json
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "meta" json;
