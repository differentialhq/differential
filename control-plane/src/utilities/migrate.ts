import "./env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as data from "../modules/data";
import { logger } from "./logger";

(async function runMigrations() {
  if (process.env.CI) {
    logger.info("CI detected, skipping database migration");
    return;
  }
  logger.info("Migrating database...");

  try {
    await migrate(data.db, { migrationsFolder: "./drizzle" });
    logger.info("Database migrated successfully");
  } catch (e) {
    logger.error("Error migrating database", {
      error: e,
    });
    process.exit(1);
  }

  await data.pool.end();
})();
