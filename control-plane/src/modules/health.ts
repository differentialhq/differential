import { db } from "./data";
import { sql } from "drizzle-orm";

export const isOk = () =>
  db
    .execute(sql`SELECT 1`)
    .then(() => true)
    .catch(() => false);
