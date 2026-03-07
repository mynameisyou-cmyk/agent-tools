/** Brave Search API wrapper with Redis caching. */

import { config } from "../config";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date: string | null;
}

export interface SearchOptions {
  query: string;
  num_results?: number;
  freshness?: "pd" | "pw" | "pm" | "py";
  country?: string;
}

const BRAVE_API = "https://api.search.brave.com/res/v1/web/search";

/**
 * Search the web via Brave Search API.
 * Returns structured results with title, URL, snippet, date.
 */
export async function search(opts: SearchOptions): Promise<SearchResult[]> {
  const { query, num_results = 5, freshness, country } = opts;

  if (!config.braveApiKey) {
    throw new Error("BRAVE_API_KEY not configured");
  }

  const params = new URLSearchParams({
    q: query,
    count: String(Math.min(num_results, 20)),
  });
  if (freshness) params.set("freshness", freshness);
  if (country) params.set("country", country);

  const response = await fetch(`${BRAVE_API}?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": config.braveApiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brave Search API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as BraveResponse;

  return (data.web?.results ?? []).slice(0, num_results).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    date: r.page_age ?? r.age ?? null,
  }));
}

// Brave API response shape (partial)
interface BraveResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      page_age?: string;
      age?: string;
    }>;
  };
}
