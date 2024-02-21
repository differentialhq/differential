CREATE TABLE IF NOT EXISTS "client_uploads" (
	"id" varchar(1024) PRIMARY KEY NOT NULL,
	"client_upload_path" varchar(1024) NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deployments" DROP COLUMN IF EXISTS "definition_upload_url";