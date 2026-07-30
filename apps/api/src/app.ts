import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { deleteRow, insertRow, updateRow } from "./data";
import { inviteEmployee } from "./invite";
import { submitRequest } from "./requests";
import { shapeProxy } from "./shapes";

export const app = new Hono();

const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
	.split(",")
	.filter(Boolean);

// CORS for all API routes. exposeHeaders lets the browser's Electric client read the
// electric-* sync headers off shape responses. Registered before the routes.
app.use(
	"/api/*",
	cors({
		origin: trustedOrigins,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		exposeHeaders: [
			"electric-offset",
			"electric-handle",
			"electric-cursor",
			"electric-up-to-date",
			"electric-schema",
		],
		credentials: true,
	}),
);

app.get("/health", (c) => c.json({ ok: true }));

// Better Auth handler (sign-in / sign-up / reset / admin, etc.)
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Electric shape auth-proxy (read path for the admin + public apps)
app.get("/api/shapes/:table", shapeProxy);

// Public intake (anonymous, Turnstile-gated)
app.post("/api/requests", submitRequest);

// Write path (permission-gated, audit-logged via app.* GUCs)
app.post("/api/data/:table", insertRow);
app.patch("/api/data/:table/:id", updateRow);
app.delete("/api/data/:table/:id", deleteRow);

// Employee invite (manage_employees) + set-password email
app.post("/api/invite", inviteEmployee);

// TODO(Phase 2): deploy the api service + custom domain.
