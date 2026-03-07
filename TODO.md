# agent-tools — Implementation TODO

Ordered by dependency. Heartbeat works top to bottom.

---

## Phase 0 — Foundation

### Domain & DNS
- [ ] [T] Check agenttools.dev availability (Cloudflare Registrar)
- [ ] [T] Check agenttools.io availability
- [ ] [T] Register chosen domain via Cloudflare Registrar
- [ ] [T] Set up Cloudflare zone: DNS, SSL (Full strict), DDoS rules
- [ ] [T] Add rate limiting rule at edge (100 req/min per IP by default)

### Git & Repo
- [ ] [T] Create private GitHub repo: agent-tools
- [ ] [T] Set branch protection: main requires PR + CI pass
- [ ] [T] Create branches: main, staging
- [ ] [T] Add .gitignore (node_modules, .env, dist, .wrangler)
- [ ] [T] Initial commit: PURPOSE.md + ARCHITECTURE.md + TODO.md

### Accounts & Services
- [ ] [T] Stripe account setup (or use existing) — create agent-tools product catalogue
- [ ] [T] Coinbase Commerce account (or Alchemy for direct USDC on Base)
- [ ] [S] Create Stripe products + prices (Builder £39, Scale £159, credit bundles)
- [ ] [T] Railway account — provision PostgreSQL + Redis
- [ ] [T] Hetzner VPS — CX42 (4 vCPU, 8GB RAM) for Playwright workers
- [ ] [T] Verify Bright Data proxy credentials in .env

---

## Phase 1 — Architecture ✅
- [x] ARCHITECTURE.md — full system design
- [x] TODO.md — this file

---

## Phase 2 — Scaffold ✅
- [x] [S] Init Bun project + package.json + scripts
- [x] [S] Install deps (hono, zod, bullmq, ioredis, drizzle, postgres, bcryptjs, stripe, cheerio, readability)
- [x] [S] Directory structure: src/{tools/browser,tools/execute,api/billing,auth,db,queue}
- [x] [T] tsconfig.json + drizzle.config.ts
- [x] [T] .env.example + .gitignore
- [x] [T] docker-compose.yml (postgres 16 + redis 7)
- [x] [S] src/db/schema.ts — Drizzle ORM (projects, api_keys, usage_events, billing_events)
- [x] [S] src/db/client.ts + src/config.ts + src/auth/keys.ts + src/auth/middleware.ts
- [x] [S] src/app.ts + src/index.ts — Hono app + Bun server
- [ ] [T] Dockerfile (multi-stage, Playwright + Chromium)
- [ ] [S] GitHub Actions: CI (bun test), deploy-staging

---

## Phase 3 — Core Build

### Auth & Projects
- [ ] [S] src/db/schema.ts — finalise + generate migration
- [ ] [S] src/auth/keys.ts — generate, hash, verify API keys
- [ ] [S] src/auth/middleware.ts — Hono middleware: extract key → load project → attach to context
- [ ] [S] src/api/projects.ts — POST /v1/projects (create project + first key)
- [ ] [S] src/api/keys.ts — GET/POST/DELETE /v1/keys

### Tool: Search
- [ ] [S] src/tools/search.ts — Brave Search API wrapper + Redis cache (1h TTL)
- [ ] [S] src/api/search.ts — POST /v1/search route (auth → deduct credits → call tool → log usage)
- [ ] [S] tests/search.test.ts

### Tool: Scrape
- [ ] [S] src/tools/scrape.ts — fetch HTML (undici) → Cheerio parse → optional schema extraction
- [ ] [S] src/api/scrape.ts — POST /v1/scrape route
- [ ] [S] tests/scrape.test.ts

### Tool: Document
- [ ] [S] src/tools/document.ts — PDF (pdfjs-dist), docx (mammoth), HTML (readability)
- [ ] [S] src/api/document.ts — POST /v1/document route
- [ ] [S] tests/document.test.ts

### Queue Infrastructure (needed for Browser + Execute)
- [ ] [C] src/queue/worker.ts — BullMQ worker setup, graceful shutdown
- [ ] [S] src/queue/jobs.ts — job definitions (browse, execute)
- [ ] [S] src/queue/results.ts — poll/stream job results

### Tool: Browser
- [ ] [C] src/tools/browser/pool.ts — Playwright session pool (5 workers, warmup, teardown)
- [ ] [C] src/tools/browser/actions.ts — action executor (navigate, click, type, extract, screenshot)
- [ ] [C] src/tools/browser/proxy.ts — Bright Data proxy rotation per session
- [ ] [S] src/api/browse.ts — POST /v1/browse route (sync < 5s, async otherwise → job_id)
- [ ] [S] src/api/jobs.ts — GET /v1/jobs/:id (poll async results)
- [ ] [C] tests/browse.test.ts

### Tool: Execute
- [ ] [C] src/tools/execute/sandbox.ts — Docker exec (spawn container, pipe stdin, cap resources)
- [ ] [S] src/tools/execute/languages.ts — Python/Node/bash configs
- [ ] [S] src/api/execute.ts — POST /v1/execute route
- [ ] [S] tests/execute.test.ts

### Usage & Credits
- [ ] [S] src/billing/credits.ts — deduct(), refund(), balance()
- [ ] [S] src/api/usage.ts — GET /v1/usage
- [ ] [S] src/billing/limits.ts — plan limit enforcement (rate limit middleware)

---

## Phase 4 — Billing

### Stripe (fiat)
- [ ] [S] src/billing/stripe.ts — Stripe client, helper functions
- [ ] [S] src/api/billing/checkout.ts — POST /v1/billing/checkout (create Stripe session)
- [ ] [S] src/api/billing/portal.ts — POST /v1/billing/portal (Stripe billing portal)
- [ ] [C] src/api/billing/webhooks.ts — handle all Stripe webhook events
  - checkout.session.completed → credits + plan
  - invoice.payment_succeeded → monthly credit renewal
  - invoice.payment_failed → grace period
  - customer.subscription.deleted → downgrade
- [ ] [S] tests/billing.test.ts (mock Stripe)

### Crypto (USDC on Base)
- [ ] [C] src/billing/crypto/wallet.ts — HD wallet, deterministic address per project (ethers.js)
- [ ] [C] src/billing/crypto/webhook.ts — Alchemy webhook handler: USDC Transfer → confirm → add credits
- [ ] [S] src/api/billing/crypto.ts — GET /v1/billing/crypto (return deposit address + QR)
- [ ] [T] Add LGM token hook (placeholder — token contract address TBD)

---

## Phase 5 — Developer Experience

- [ ] [S] OpenAPI spec auto-generated (Hono Zod OpenAPI) — /docs endpoint
- [ ] [S] src/api/health.ts — GET /health (DB + Redis + queue status)
- [ ] [C] Landing page — Next.js or plain HTML: what it is, pricing table, "Get API Key" CTA
- [ ] [S] Dashboard — usage graph, credit balance, API key management (simple Next.js)
- [ ] [S] SDK: TypeScript client (thin REST wrapper, published to npm)
- [ ] [S] SDK: Python client (published to PyPI)
- [ ] [T] README.md — quick start, API reference link, pricing

---

## Phase 6 — Infrastructure & Deploy

- [ ] [S] DEPLOY.md — full production deploy runbook
- [ ] [C] Hetzner VPS setup: Docker, Playwright dependencies, Chromium, env vars
- [ ] [S] Railway: PostgreSQL + Redis provisioned and connected
- [ ] [S] Cloudflare: domain pointed, SSL full strict, WAF rules, rate limiting
- [ ] [S] GitHub Actions: deploy-staging (auto on push), deploy-prod (manual approval)
- [ ] [S] Healthcheck: UptimeRobot or Cloudflare health alerts
- [ ] [T] Set up error tracking (Sentry or equivalent)

---

## Phase 7 — Go-to-Market

- [ ] [T] ProductHunt draft: title, tagline, gallery, first comment
- [ ] [S] Show HN post draft: "I built a reliable tool API for AI agents..."
- [ ] [T] Post in LangChain Discord, AutoGen Discord, CrewAI Discord
- [ ] [S] Blog post: "Why AI agent tools fail in production (and how to fix it)"
- [ ] [T] Twitter/X thread: the problem, the solution, the link
- [ ] [T] Update DEVICE.md → stream status "live"
- [ ] [T] Message Yu: "🟢 agent-tools is live at agenttools.dev"
