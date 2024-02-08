ALTER TABLE "deployments" ADD COLUMN "provider" text NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "deployment_provider" text;