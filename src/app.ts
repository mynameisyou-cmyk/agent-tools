/** Hono application entry point. */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Health check (no auth)
app.get("/health", (c) => c.json({ status: "ok", version: "0.1.0" }));

// TODO: mount tool routes (auth-protected)
// app.route("/v1", toolRoutes);

export default app;
