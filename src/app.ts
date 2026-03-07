/** Hono application entry point. */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { authMiddleware, type ProjectContext } from "./auth/middleware";
import { searchRouter } from "./api/search";
import { scrapeRouter } from "./api/scrape";
import { documentRouter } from "./api/document";
import { browseApp } from "./api/browse";
import { jobsApp } from "./api/jobs";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Health check (no auth)
app.get("/health", (c) => c.json({ status: "ok", version: "0.1.0" }));

// Authenticated tool routes
const v1 = new Hono<ProjectContext>();
v1.use("*", authMiddleware);
v1.route("/", searchRouter);
v1.route("/", scrapeRouter);
v1.route("/", documentRouter);
v1.route("/browse", browseApp);
v1.route("/jobs", jobsApp);

// TODO: mount remaining tool routes
// v1.route("/", executeRouter);
// v1.route("/", usageRouter);

app.route("/v1", v1);

export default app;
