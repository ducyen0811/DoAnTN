import pg from "pg";
import { config } from "../src/config.js";

const url = new URL(config.DATABASE_URL);
const name = decodeURIComponent(url.pathname.slice(1));
if (!/^[a-z][a-z0-9_]{0,62}$/.test(name))
  throw new Error("Use a lowercase database name with letters, digits or underscores");
url.pathname = "/postgres";
const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  const result = await client.query("SELECT 1 FROM pg_database WHERE datname=$1", [name]);
  if (!result.rowCount) await client.query(`CREATE DATABASE "${name}"`);
  console.log(`PostgreSQL database ${name}: ready`);
} catch (error) {
  console.error(
    "Cannot prepare PostgreSQL database:",
    (error as { code?: string }).code ?? "connection error",
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
