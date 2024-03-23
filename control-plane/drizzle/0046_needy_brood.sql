CREATE TABLE IF NOT EXISTS "predictive_retries_cache" (
	"error_name" varchar(1024) NOT NULL,
	"error_message" varchar(1024) NOT NULL,
	"retryable" boolean NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT predictive_retries_cache_error_name_error_message PRIMARY KEY("error_name","error_message")
);
