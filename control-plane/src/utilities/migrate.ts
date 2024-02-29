import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as data from "../modules/data";
import "./env";

(async function runMigrations() {
  console.log("Migrating database...");

  console.log(process.env.DATABASE_URL);

  try {
    await migrate(data.db, { migrationsFolder: "./drizzle" });
    console.log("Database migrated successfully");
  } catch (e) {
    console.error("Error migrating database", e);
    process.exit(1);
  }

  await data.pool.end();
})();
