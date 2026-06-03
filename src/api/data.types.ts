/**
 * @file Client-side type contract for the `data/load` Azure Function.
 *
 * Mirrors the back-end request/response shapes so the React app and Function
 * stay in sync. Keep this file authoritative on the front end; ideally these
 * types are generated from or shared with the back end.
 *
 * @module api/data.types
 */

/** Sort specification mirroring the back end: `{ field: 1 | -1 }`. */
export type SortSpec = Record<string, 1 | -1>;

/** Projection specification, e.g. `{ name: 1, _id: 0 }`. */
export type ProjectionSpec = Record<string, 0 | 1 | boolean>;

/**
 * A single collection to load.
 *
 * @typeParam TKey - Literal key type, enabling typed result lookups.
 */
export interface CollectionQuery<TKey extends string = string> {
  /** Property name under which the result is returned. Must be unique per request. */
  key: TKey;
  /** Collection name to read from. */
  name: string;
  /** MongoDB filter. Defaults to all documents. */
  filter?: Record<string, unknown>;
  /** Fields to include/exclude. */
  projection?: ProjectionSpec;
  /** `"field"` (asc), `"-field"` (desc), or an explicit sort object. */
  orderBy?: string | SortSpec;
  /** Max documents to return (server-capped). */
  limit?: number;
  /** Documents to skip (paging). */
  skip?: number;
  /** When `true`, returns a single document (or `null`) instead of an array. */
  single?: boolean;
}

/** A database and the collections to load from it. */
export interface DatabaseLoadSpec {
  /** Database name. Omit to use the Function's configured default. */
  db?: string;
  /** Collections to load from this database. */
  collections: CollectionQuery[];
}

/** Request body for the `data/load` Function. */
export interface LoadCollectionsRequest {
  /** One or more databases, each with its own collections. */
  databases: DatabaseLoadSpec[];
}

/**
 * Successful response payload.
 *
 * @typeParam TResults - A map of each `key` to its result type. Defaults to a
 * loose record when the caller does not supply a shape.
 */
export interface LoadCollectionsResponse<
  TResults extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Results keyed by the caller-supplied `key`. */
  results: TResults;
  /** Per-key error messages for collections that failed (partial success). */
  errors?: Record<string, string>;
}