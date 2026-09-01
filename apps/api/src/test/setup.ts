import { afterAll } from "vitest";
import { pool } from "../db";

// Vitest isolates each test file, so the pool this closes is the one that file opened. Without
// it a worker holds an idle connection open after the last assertion and the run does not exit.
afterAll(async () => {
	await pool.end();
});
