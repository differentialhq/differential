ALTER TABLE "jobs" ADD COLUMN "predicted_to_be_retryable" boolean;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "predicted_to_be_retryable_reason" text;