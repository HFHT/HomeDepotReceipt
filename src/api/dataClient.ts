/**
 * @file Typed fetch wrapper for the `data/load` Azure Function.
 *
 * @module api/dataClient
 */

import type {
  LoadCollectionsRequest,
  LoadCollectionsResponse,
} from './data.types.js';

/** Base URL of the Function App, e.g. `https://hfh-functions.azurewebsites.net/api`. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

/**
 * Error thrown when the `data/load` request fails at the transport or
 * HTTP level (as opposed to a per-collection error, which is returned in
 * the response body under `errors`).
 */
export class DataApiError extends Error {
  /** HTTP status code, when available. */
  readonly status?: number;

  /** Optional structured error payload from the server. */
  readonly details?: unknown;

  /**
   * @param message - Human-readable error message.
   * @param status - HTTP status code, when available.
   * @param details - Optional structured error payload from the server.
   */
  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'DataApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Loads one or more MongoDB collections via the `data/load` Function.
 *
 * @remarks
 * Provide a `TResults` type argument to get fully-typed results keyed by your
 * collection `key`s. Per-collection failures are surfaced on
 * `response.errors`, not thrown — only transport/HTTP failures throw.
 *
 * @typeParam TResults - Map of `key` → expected result shape.
 * @param request - The databases/collections to load.
 * @param accessToken - Bearer token from MSAL (see {@link acquireToken}).
 * @param signal - Optional abort signal for cancellation.
 * @returns A promise resolving to the typed response.
 * @throws {DataApiError} On non-2xx responses or network failures.
 *
 * @example
 * ```ts
 * interface Catalog {
 *   activeProducts: Product[];
 *   siteConfig: SiteConfig | null;
 * }
 * const { results, errors } = await loadCollections<Catalog>(
 *   {
 *     databases: [{
 *       db: 'catalog',
 *       collections: [
 *         { key: 'activeProducts', name: 'products',
 *           filter: { active: true }, orderBy: '-createdAt', limit: 50 },
 *         { key: 'siteConfig', name: 'config', single: true },
 *       ],
 *     }],
 *   },
 *   token,
 * );
 * results.activeProducts; // Product[]
 * results.siteConfig;     // SiteConfig | null
 * ```
 */
export async function loadCollections<
  TResults extends Record<string, unknown> = Record<string, unknown>,
>(
  request: LoadCollectionsRequest,
  accessToken: string,
  signal?: AbortSignal
): Promise<LoadCollectionsResponse<TResults>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/data/load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
      signal,
    });
  } catch (err) {
    throw new DataApiError(
      err instanceof Error ? err.message : 'Network request failed'
    );
  }

  if (!response.ok) {
    const details = await response.json().catch(() => undefined);
    throw new DataApiError(
      (details as { error?: string })?.error ??
        `Request failed with status ${response.status}`,
      response.status,
      details
    );
  }

  return (await response.json()) as LoadCollectionsResponse<TResults>;
}