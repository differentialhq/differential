CREATE TABLE IF NOT EXISTS "credentials" (
	"id" varchar(1024) PRIMARY KEY NOT NULL,
	"api_key" varchar(1024) NOT NULL,
	"api_secret" varchar(1024) NOT NULL,
	"environment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
