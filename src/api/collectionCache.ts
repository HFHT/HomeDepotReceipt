/**
 * @file TTL-based `localStorage` cache for `data/load` responses.
 *
 * Designed for static or slow-changing content (settings, navigation,
 * lookup tables) where avoiding a network round trip is worthwhile.
 *
 * @module api/collectionCache
 */

import type { LoadCollectionsResponse } from './data.types.js';

/** Namespace prefix to avoid key collisions with other `localStorage` users. */
const CACHE_PREFIX = 'hfh:data:';

/** Default time-to-live: 24 hours. */
export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/** Internal cache envelope persisted to `localStorage`. */
interface CacheEntry<TResults extends Record<string, unknown>> {
  /** Epoch milliseconds when the entry was written. */
  cachedAt: number;
  /** The cached response payload. */
  payload: LoadCollectionsResponse<TResults>;
}

/**
 * Indicates whether `localStorage` is usable (guards SSR / privacy modes).
 *
 * @returns `true` when `localStorage` can be read and written.
 * @internal
 */
function isStorageAvailable(): boolean {
  try {
    const probe = '__hfh_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads a cached response if present and not expired.
 *
 * @typeParam TResults - Expected result map shape.
 * @param cacheKey - Caller-supplied stable key identifying the request.
 * @param ttlMs - Maximum age before the entry is considered stale.
 * @returns The cached payload, or `null` when missing, stale, or unreadable.
 */
export function readCache<
  TResults extends Record<string, unknown> = Record<string, unknown>,
>(cacheKey: string, ttlMs: number): LoadCollectionsResponse<TResults> | null {
  if (!isStorageAvailable()) return null;

  const raw = localStorage.getItem(CACHE_PREFIX + cacheKey);
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw) as CacheEntry<TResults>;
    if (Date.now() - entry.cachedAt > ttlMs) {
      localStorage.removeItem(CACHE_PREFIX + cacheKey);
      return null;
    }
    return entry.payload;
  } catch {
    localStorage.removeItem(CACHE_PREFIX + cacheKey);
    return null;
  }
}

/**
 * Writes a response to the cache.
 *
 * @typeParam TResults - Result map shape.
 * @param cacheKey - Caller-supplied stable key identifying the request.
 * @param payload - The response to cache.
 */
export function writeCache<TResults extends Record<string, unknown>>(
  cacheKey: string,
  payload: LoadCollectionsResponse<TResults>
): void {
  if (!isStorageAvailable()) return;
  const entry: CacheEntry<TResults> = { cachedAt: Date.now(), payload };
  try {
    localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(entry));
  } catch {
    // Quota exceeded or serialization failure — caching is best-effort.
  }
}

/**
 * Removes a single cached entry.
 *
 * @param cacheKey - The key to invalidate.
 */
export function invalidateCache(cacheKey: string): void {
  if (!isStorageAvailable()) return;
  localStorage.removeItem(CACHE_PREFIX + cacheKey);
}

/**
 * Removes every entry written by this module (all keys under the prefix).
 */
export function clearAllCache(): void {
  if (!isStorageAvailable()) return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}