/**
 * @file Stub service for AI analysis of Home Depot receipt images.
 *
 * STAGING NOTE (for the developer): this belongs in src/services until wired
 * into the official src/api layer. It currently fakes the backend round-trip.
 *
 * ASSUMED BACKEND ENDPOINT (not yet present in src/api):
 *   POST /api/receipts/analyze
 *     Request:  multipart/form-data with field `images[]` and an `imageId`
 *               per file (or a JSON manifest mapping order -> imageId).
 *     Response: ReceiptAnalysisResponse (see lib/receipts/types.ts)
 *
 * When the endpoint exists, replace the stubbed body with a call referencing
 * the curated client in src/api (e.g. `import { receiptsApi } from '@/api'`).
 */

import { CapturedImage, ReceiptAnalysisResponse, ReceiptAnalysisResult } from "../lib/receipts/types";



/**
 * Produces a deterministic-looking fake receipt result for a given image.
 *
 * @param image - The captured image to fabricate a result for.
 * @returns A simulated successful or failed analysis result.
 */
const fakeResultFor = (image: CapturedImage): ReceiptAnalysisResult => {
  // Simulate a failure for any file whose name hints at a blurry/partial photo,
  // and randomly fail ~15% of the rest so the retake flow is exercisable.
  const looksBad = /blur|dark|partial|fail/i.test(image.fileName);
  const randomlyFails = Math.random() < 0.15;

  if (looksBad || randomlyFails) {
    return {
      imageId: image.id,
      fileName: image.fileName,
      data: null,
      error:
        'Could not read this receipt clearly. Please retake the photo with better lighting and the full receipt in frame.',
    };
  }

  return {
    imageId: image.id,
    fileName: image.fileName,
    data: {
      storeNumber: '6321',
      purchaseDate: new Date().toISOString().slice(0, 10),
      receiptNumber: `HD-${Math.floor(Math.random() * 1_000_000)}`,
      subtotal: 184.23,
      tax: 14.92,
      total: 199.15,
      paymentMethod: 'VISA ****1234',
      lineItems: [
        {
          sku: '1001234567',
          description: '2x4x8 Pressure Treated Lumber',
          quantity: 12,
          unitPrice: 6.48,
          totalPrice: 77.76,
        },
        {
          sku: '1009876543',
          description: 'Exterior Wood Screws 5lb',
          quantity: 2,
          unitPrice: 24.97,
          totalPrice: 49.94,
        },
      ],
    },
    error: null,
  };
};

/**
 * Sends one or more captured images to the AI service for parsing.
 *
 * @param images - The images to analyze.
 * @returns A promise resolving to one {@link ReceiptAnalysisResult} per image.
 * @throws {Error} If the (future) network request fails.
 *
 * @example
 * ```ts
 * const { results } = await analyzeReceiptImages(store.images);
 * const failures = results.filter((r) => r.error);
 * ```
 */
export async function analyzeReceiptImages(
  images: CapturedImage[]
): Promise<ReceiptAnalysisResponse> {
  // Simulate network latency.
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    results: images.map(fakeResultFor),
  };
}