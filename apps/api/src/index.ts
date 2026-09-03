import { serve } from "@hono/node-server";
import { app } from "./app";

// Railway injects PORT, so the fallback only ever applies to a local run with no `.env`.
// It is 3543 rather than 3000 because 3000 belongs to another project on the development
// machine: an unset PORT used to hand this server that project's port, which fails as a
// confusing 502 through Caddy rather than as a bind error. See the Caddyfile.
const port = Number(process.env.PORT ?? 3543);
serve({ fetch: app.fetch, port }, (info) => {
	console.log(`api listening on :${info.port}`);
});
