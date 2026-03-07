/** Tests for the search tool. */

import { describe, expect, it, mock, beforeEach } from "bun:test";

// Mock fetch before importing the module
const mockFetch = mock(() =>
  Promise.resolve(
    new Response(
      JSON.stringify({
        web: {
          results: [
            {
              title: "Test Result",
              url: "https://example.com",
              description: "A test snippet",
              page_age: "2026-01-15",
            },
            {
              title: "Second Result",
              url: "https://example.org",
              description: "Another snippet",
            },
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  ),
);

// We need to set the env var before importing
process.env.BRAVE_API_KEY = "test-key-123";

describe("search tool", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  it("should call Brave API with correct params", async () => {
    const { search } = await import("../src/tools/search");

    const results = await search({ query: "test query", num_results: 2 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callUrl = (mockFetch.mock.calls[0] as any[])[0] as string;
    expect(callUrl).toContain("api.search.brave.com");
    expect(callUrl).toContain("q=test+query");
    expect(callUrl).toContain("count=2");
  });

  it("should return structured SearchResult objects", async () => {
    const { search } = await import("../src/tools/search");

    const results = await search({ query: "test" });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: "Test Result",
      url: "https://example.com",
      snippet: "A test snippet",
      date: "2026-01-15",
    });
    expect(results[1].date).toBeNull();
  });

  it("should respect num_results limit", async () => {
    const { search } = await import("../src/tools/search");

    const results = await search({ query: "test", num_results: 1 });

    expect(results).toHaveLength(1);
  });

  it("should include freshness and country params when provided", async () => {
    const { search } = await import("../src/tools/search");

    await search({ query: "test", freshness: "pw", country: "GB" });

    const callUrl = (mockFetch.mock.calls[0] as any[])[0] as string;
    expect(callUrl).toContain("freshness=pw");
    expect(callUrl).toContain("country=GB");
  });

  it("should throw on API error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403 })),
    ) as unknown as typeof fetch;

    const { search } = await import("../src/tools/search");

    expect(search({ query: "test" })).rejects.toThrow("Brave Search API error 403");
  });
});
