/** Application configuration from environment variables. */

export const config = {
  // Database
  databaseUrl: env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/agent_tools"),

  // Redis
  redisUrl: env("REDIS_URL", "redis://localhost:6379"),

  // External APIs
  braveApiKey: env("BRAVE_API_KEY", ""),
  brightDataProxy: env("BRIGHT_DATA_PROXY", ""),
  openaiApiKey: env("OPENAI_API_KEY", ""),

  // Stripe
  stripeSecretKey: env("STRIPE_SECRET_KEY", ""),
  stripeWebhookSecret: env("STRIPE_WEBHOOK_SECRET", ""),

  // Crypto
  cryptoHdMnemonic: env("CRYPTO_HD_MNEMONIC", ""),
  alchemyWebhookSecret: env("ALCHEMY_WEBHOOK_SECRET", ""),

  // Application
  port: Number(env("PORT", "3000")),
  host: env("HOST", "0.0.0.0"),
  logLevel: env("LOG_LEVEL", "info"),
  nodeEnv: env("NODE_ENV", "development"),

  // Credit costs per operation
  credits: {
    search: Number(env("CREDIT_SEARCH", "1")),
    scrape: Number(env("CREDIT_SCRAPE", "2")),
    browse: Number(env("CREDIT_BROWSE", "5")),
    document: Number(env("CREDIT_DOCUMENT", "3")),
    executePer10s: Number(env("CREDIT_EXECUTE_PER_10S", "1")),
  },

  // agent-economy (billing authority — internal)
  economyUrl: env("ECONOMY_URL", "http://localhost:8004"),

  // Plan limits
  plans: {
    dev: { credits: 100, ratePerMin: 10 },
    builder: { credits: 5_000, ratePerMin: 60 },
    scale: { credits: 25_000, ratePerMin: 300 },
    enterprise: { credits: Infinity, ratePerMin: 1_000 },
  },
} as const;

function env(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export type Plan = keyof typeof config.plans;
