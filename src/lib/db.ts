import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db-schema";

export type Database = NodePgDatabase<typeof schema>;

let db: Database | undefined;

/** Lazy Drizzle client over a shared `pg` pool. */
export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database access");
  }

  db ??= drizzle(new Pool({ connectionString }), { schema });
  return db;
}
