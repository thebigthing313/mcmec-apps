import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { assetsRouter } from "./assets";
import { auth } from "./auth";
import { postCommands } from "./commands/dispatch";
import { deleteRow, insertRow, updateRow } from "./data";
import { inviteEmployee } from "./invite";
import { importMosquitoActivity } from "./mosquito";
import { submitRequest } from "./requests";
import { shapeProxy } from "./shapes";
import { setSprayScheduleMunicipalities } from "./spray-municipalities";
import { setUserRoles } from "./users";

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
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// Shared brand images for all six frontends. Deliberately outside `/api/*`: these are plain
// `<img>` and `<link rel="icon">` loads, which are not CORS-gated, so they need no preflight
// and no origin allowlist.
app.route("/assets", assetsRouter);

// Better Auth handler (sign-in / sign-up / reset / admin, etc.)
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Electric shape auth-proxy (read path for the admin + public apps)
app.get("/api/shapes/:table", shapeProxy);

// Public intake (anonymous, Turnstile-gated). 64 KB cap — the body is parsed before the
// honeypot/Turnstile checks, so bound it up front on this unauthenticated route.
app.post("/api/requests", bodyLimit({ maxSize: 64 * 1024 }), submitRequest);

// Write path (permission-gated, audit-logged via app.* GUCs)
app.post("/api/commands", postCommands);
app.post("/api/data/:table", insertRow);
app.patch("/api/data/:table/:id", updateRow);
app.delete("/api/data/:table/:id", deleteRow);

// Non-CRUD writes (composite-key / bulk / role) that the generic /api/data path can't express
app.put("/api/users/:id/roles", setUserRoles); // manage_users
app.post("/api/mosquito-activity/import", importMosquitoActivity); // manage_website
app.put(
	"/api/spray-schedules/:id/municipalities",
	setSprayScheduleMunicipalities,
); // manage_website

// Employee invite (manage_employees) + set-password email
app.post("/api/invite", inviteEmployee);
