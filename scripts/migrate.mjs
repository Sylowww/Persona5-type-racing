// Applies pending SQL migrations from db/migrations in filename order.
// Usage: npm run db:migrate (needs DATABASE_URL, loaded from .env if present).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

try {
  process.loadEnvFile();
} catch {
  // No .env file; rely on the environment.
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const dir = path.join(import.meta.dirname, "..", "db", "migrations");
const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString });
await client.connect();

try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const { rows } = await client.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`migration ${file} failed: ${error.message}`);
    }
  }
  console.log("database is up to date");
} finally {
  await client.end();
}
