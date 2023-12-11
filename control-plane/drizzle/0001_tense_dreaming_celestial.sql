ALTER TABLE "jobs" DROP CONSTRAINT "jobs_environment_id_environments_id_fk";
--> statement-breakpoint
ALTER TABLE "machines" DROP CONSTRAINT "machines_environment_id_environments_id_fk";
--> statement-breakpoint
DROP TABLE "environments";--> statement-breakpoint
DROP TABLE "machine_callable_targets";--> statement-breakpoint
DROP TABLE "users";