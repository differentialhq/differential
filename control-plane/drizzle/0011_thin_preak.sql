ALTER TABLE "machines" ADD COLUMN "ip" varchar(1024);--> statement-breakpoint
ALTER TABLE "machines" ADD COLUMN "cluster_id" varchar NOT NULL;