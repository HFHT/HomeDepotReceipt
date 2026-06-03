/**
 * @file Stub service for persisting a completed receipt submission.
 *
 * STAGING NOTE (for the developer): lives in src/services pending integration
 * into the curated src/api clients.
 *
 * ASSUMED BACKEND ENDPOINT (not yet present in src/api):
 *   POST /api/receipts
 *     Request:  ReceiptSubmission (JSON) plus image blobs uploaded to Azure
 *               Blob Storage (the function returns blob references).
 *     Response: { id: string } — the persisted submission id.
 *
 * Replace the stub body with a call referencing the official client once the
 * endpoint is wired up.
 */

import { ReceiptSubmission } from "../lib/receipts/types";


/** Result of a successful persistence call. */
export interface ReceiptSubmissionResult {
  /** The id assigned to the stored submission. */
  id: string;
}

/**
 * Persists the full receipt submission (member, project metadata, and reviewed
 * receipts including both initial and edited values).
 *
 * @param submission - The completed, user-reviewed submission.
 * @returns A promise resolving to the stored submission's id.
 * @throws {Error} If the (future) network request fails.
 *
 * @example
 * ```ts
 * const { id } = await saveReceiptSubmission(submission);
 * ```
 */
export async function saveReceiptSubmission(
  submission: ReceiptSubmission
): Promise<ReceiptSubmissionResult> {
  // Simulate network latency.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // eslint-disable-next-line no-console
  console.info('[stub] saveReceiptSubmission payload:', submission);

  return { id: `submission-${Date.now()}` };
}