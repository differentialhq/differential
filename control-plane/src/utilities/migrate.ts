import "./env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as data from "../modules/data";

(async function runMigrations() {
  console.log("Migrating database...");

  try {
    await migrate(data.db, { migrationsFolder: "./drizzle" });
    console.log("Database migrated successfully");
  } catch (e) {
    console.error("Error migrating database", e);
    process.exit(1);
  }

  await data.pool.end();
})();
