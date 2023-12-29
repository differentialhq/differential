import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import {
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { invariant } from "../utils";
import { sql } from "drizzle-orm";

const connectionString = invariant(
  process.env.DATABASE_URL,
  "DATABASE_URL must be set"
);

const sslDisabled = process.env.DATABASE_SSL_DISABLED === "true";

console.log("Attempting to connect to database", {
  sslDisabled,
});

const pool = new Pool({
  connectionString,
  ssl: sslDisabled
    ? false
    : {
        rejectUnauthorized: false,
      },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.on("connect", (client) => {
  console.log("Connected to database");
});

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 1024 }).primaryKey(),
  owner_hash: text("owner_hash").notNull(),
  target_fn: varchar("target_fn", { length: 1024 }).notNull(),
  target_args: text("target_args").notNull(),
  idempotency_key: varchar("idempotency_key", { length: 1024 }).notNull(),
  status: text("status", {
    enum: ["pending", "running", "success", "failure"],
  }).notNull(),
  result: text("result"),
  result_type: text("result_type", {
    enum: ["resolution", "rejection"],
  }),
  machine_type: text("machine_type"),
  remaining: integer("remaining").default(1),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resulted_at: timestamp("resulted_at", { withTimezone: true }),
  runtime_latency_ms: integer("runtime_latency_ms"),
  timing_out_at: timestamp("timed_out_at", { withTimezone: true }).default(
    sql`now() + interval '300 seconds'`
  ),
  timeout_interval_seconds: integer("timeout_interval").default(300),
  service: varchar("service", { length: 1024 }),
});

export const machines = pgTable("machines", {
  id: varchar("id", { length: 1024 }).primaryKey(),
  description: varchar("description", { length: 1024 }),
  machine_type: varchar("class", { length: 1024 }),
  last_ping_at: timestamp("last_ping_at", { withTimezone: true }),
  ip: varchar("ip", { length: 1024 }),
  cluster_id: varchar("cluster_id").notNull(),
});

export const clusters = pgTable("clusters", {
  id: varchar("id", { length: 1024 }).primaryKey(),
  api_secret: varchar("api_secret", { length: 1024 }).notNull(),
  description: varchar("description", { length: 1024 }),
  // TODO: deprecate this
  organization_id: varchar("organization_id"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  wake_up_config: json("wake_up_config"),
  owner_id: varchar("owner_id"),
});

export const db = drizzle(pool);

(async function () {
  console.log("Migrating database...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
  } catch (e) {
    console.error("Error migrating database", e);
    process.exit(1);
  }
})();
