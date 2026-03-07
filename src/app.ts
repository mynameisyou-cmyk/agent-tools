/** Hono application — all routes wired. */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import searchRoutes from "./api/search";
import scrapeRoutes from "./api/scrape";
import documentRoutes from "./api/document";
import browseRoutes from "./api/browse";
import executeRoutes from "./api/execute";
import jobsRoutes from "./api/jobs";
import usageRoutes from "./api/usage";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Health check (no auth)
app.get("/health", (c) =>
  c.json({ status: "ok", version: "0.1.0", tools: ["search", "scrape", "browse", "document", "execute"] }),
);

// Tool routes (auth-protected via individual routers)
app.route("/v1/search", searchRoutes);
app.route("/v1/scrape", scrapeRoutes);
app.route("/v1/document", documentRoutes);
app.route("/v1/browse", browseRoutes);
app.route("/v1/execute", executeRoutes);
app.route("/v1/jobs", jobsRoutes);
app.route("/v1/usage", usageRoutes);

// 404 fallback
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

export default app;
