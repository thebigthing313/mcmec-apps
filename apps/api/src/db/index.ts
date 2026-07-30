import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// DATABASE_URL points at the least-privilege app role (see triggers.sql), NOT the postgres
// superuser. The role can CRUD data tables, SELECT audit_log, and INSERT notice_postings —
// but cannot UPDATE/DELETE the append-only tables.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export type DB = typeof db;
