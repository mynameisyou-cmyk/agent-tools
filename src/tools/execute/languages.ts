/** Language configurations for sandboxed execution. */

export interface LanguageConfig {
  image: string;
  command: (code: string) => string[];
  fileExt: string;
  defaultTimeout: number; // ms
  maxTimeout: number;     // ms
  memoryLimit: string;    // Docker memory limit
}

export const languages: Record<string, LanguageConfig> = {
  python: {
    image: "python:3.11-slim",
    command: (code) => ["python3", "-c", code],
    fileExt: ".py",
    defaultTimeout: 10_000,
    maxTimeout: 30_000,
    memoryLimit: "256m",
  },
  javascript: {
    image: "node:22-slim",
    command: (code) => ["node", "-e", code],
    fileExt: ".js",
    defaultTimeout: 10_000,
    maxTimeout: 30_000,
    memoryLimit: "256m",
  },
  bash: {
    image: "alpine:3.19",
    command: (code) => ["sh", "-c", code],
    fileExt: ".sh",
    defaultTimeout: 10_000,
    maxTimeout: 30_000,
    memoryLimit: "128m",
  },
};

export type SupportedLanguage = keyof typeof languages;

export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return lang in languages;
}
