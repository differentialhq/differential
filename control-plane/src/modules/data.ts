import { drizzle } from "drizzle-orm/node-postgres";
import {
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { invariant } from "../utilities/invariant";
import { sql } from "drizzle-orm";

const connectionString = invariant(
  process.env.DATABASE_URL,
  "DATABASE_URL must be set",
);

const sslDisabled = process.env.DATABASE_SSL_DISABLED === "true";

console.log("Attempting to connect to database", {
  sslDisabled,
});

export const pool = new Pool({
  connectionString,
  ssl: sslDisabled
    ? false
    : {
        rejectUnauthorized: false,
      },
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

pool.on("connect", (client) => {
  console.debug("Connected to database");
});

pool.on("release", () => {
  // console.debug("Database connection released");
});

pool.on("remove", () => {
  console.debug("Database connection removed");
});

export const jobs = pgTable(
  "jobs",
  {
    // this column is poorly named, it's actually the job id
    // TODO: (good-first-issue) rename this column to execution_id
    id: varchar("id", { length: 1024 }).notNull(),
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
    function_execution_time_ms: integer("function_execution_time_ms"),
    timing_out_at: timestamp("timed_out_at", { withTimezone: true }).default(
      sql`now() + interval '300 seconds'`,
    ),
    timeout_interval_seconds: integer("timeout_interval").default(300),
    service: varchar("service", { length: 1024 }).notNull(),
  },
  (table) => ({
    pk: primaryKey(table.owner_hash, table.target_fn, table.idempotency_key),
  }),
);

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

export const services = pgTable(
  "services",
  {
    cluster_id: varchar("cluster_id")
      .references(() => clusters.id)
      .notNull(),
    service: varchar("service", { length: 1024 }).notNull(),
    definition: json("definition").notNull(),
  },
  (table) => ({
    pk: primaryKey(table.cluster_id, table.service),
  }),
);

export const db = drizzle(pool);

export const isAlive = async () => {
  await db.execute(sql`select 1`);
};
