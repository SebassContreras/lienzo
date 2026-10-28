import {
  resolveLocalTtsBaseUrl,
  resolveOpenRouterApiKey,
  resolveOpenRouterBaseUrl,
  resolveTtsProvider,
  type TtsProviderType,
} from "./config.ts";
import { LocalTtsAdapter } from "./local-adapter.ts";
import { OpenRouterTtsAdapter } from "./openrouter-adapter.ts";
import type { TtsService } from "./types.ts";

export interface CreateTtsServiceOptions {
  provider?: TtsProviderType | string;
  apiKey?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

/**
 * Creates and returns the appropriate TtsService implementation (D1, R1, R3).
 * Follows Principle 3 (Service Layer + Anti-Corruption / Dependency Inversion).
 */
export function createTtsService(
  options: CreateTtsServiceOptions = {},
): TtsService {
  const provider = resolveTtsProvider(options.provider);

  if (provider === "local" || provider === "kokoro" || provider === "custom") {
    const baseUrl = resolveLocalTtsBaseUrl(options.baseUrl);
    return new LocalTtsAdapter(baseUrl, options.fetchFn);
  }

  // Default to OpenRouter
  const apiKey = resolveOpenRouterApiKey(options.apiKey);
  const baseUrl = resolveOpenRouterBaseUrl(options.baseUrl);
  return new OpenRouterTtsAdapter(apiKey, baseUrl, options.fetchFn);
}
