CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(1024) PRIMARY KEY NOT NULL,
	"email" varchar(1024) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clusters" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clusters" ADD COLUMN "description" varchar(1024);--> statement-breakpoint
ALTER TABLE "clusters" ADD COLUMN "owner_id" varchar;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clusters" ADD CONSTRAINT "clusters_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
