/**
 * @fileoverview Type definitions and runtime (zod) schemas for the
 * Receipt Analysis Service. The zod schemas mirror the TypeScript types
 * exactly and are used to validate:
 *   1. The incoming request body from the caller.
 *   2. The JSON returned by Claude, before it is trusted and sent back
 *      to the client.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export type ReceiptAnalysisRequest = {
  imageBase64: string;
  mediaType: string;
}[];

export const AllowedMediaTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const ReceiptAnalysisRequestItemSchema = z.object({
  imageBase64: z.string().min(1, "imageBase64 must not be empty"),
  mediaType: z.enum(AllowedMediaTypes, {
    error: `mediaType must be one of: ${AllowedMediaTypes.join(", ")}`,
  }),
});

export const ReceiptAnalysisRequestSchema = z
  .array(ReceiptAnalysisRequestItemSchema)
  .min(1, "At least one image is required")
  .max(20, "A maximum of 20 images is supported per request");

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export type ReceiptAnalysisResponseItems = {
  id: string;
  sku_or_upc: string | null;
  title: string | null;
  unit_price: number | null;
  quantity: number | null;
  discount: number | null;
  total_price: number | null;
};

export type ReceiptAnalysisResponse = {
  supplier: string | null;
  receipt_number: string | null;
  date: string | null;
  total: number | null;
  total_discount: number | null;
  total_tax: number | null;
  subtotal: number | null;
  payment_method: string | null;
  line_items: ReceiptAnalysisResponseItems[];
  image_results: ReceiptAnalysisImageResults;
};

export type ReceiptAnalysisImageResults = {
  imageResults: ReceiptAnalysisImageResult[];
  overallStatus: ImageProcessingStatus;
};

export type ImageProcessingStatus = "success" | "needs_review" | "failed";

export type ReceiptImageIssue =
  | "blurry"
  | "glare"
  | "too_dark"
  | "cropped_or_cut_off"
  | "not_a_receipt"
  | "duplicate_page"
  | "wrong_orientation"
  | "unreadable_text"
  | "low_confidence_extraction";

export type ReceiptAnalysisImageResult = {
  imageIndex: number;
  status: ImageProcessingStatus;
  confidence: "high" | "medium" | "low" | null;
  issues: ReceiptImageIssue[];
  message: string | null;
};

// --- zod mirrors of the response types (used to validate Claude's output) --

const ImageProcessingStatusSchema = z.enum([
  "success",
  "needs_review",
  "failed",
]);

const ReceiptImageIssueSchema = z.enum([
  "blurry",
  "glare",
  "too_dark",
  "cropped_or_cut_off",
  "not_a_receipt",
  "duplicate_page",
  "wrong_orientation",
  "unreadable_text",
  "low_confidence_extraction",
]);

const ReceiptAnalysisImageResultSchema = z.object({
  imageIndex: z.number().int().nonnegative(),
  status: ImageProcessingStatusSchema,
  confidence: z.enum(["high", "medium", "low"]).nullable(),
  issues: z.array(ReceiptImageIssueSchema),
  message: z.string().nullable(),
});

const ReceiptAnalysisImageResultsSchema = z.object({
  imageResults: z.array(ReceiptAnalysisImageResultSchema),
  overallStatus: ImageProcessingStatusSchema,
});

const ReceiptAnalysisResponseItemSchema = z.object({
  id: z.string(),
  sku_or_upc: z.string().nullable(),
  title: z.string().nullable(),
  unit_price: z.number().nullable(),
  quantity: z.number().nullable(),
  discount: z.number().nullable(),
  total_price: z.number().nullable(),
});

export const ReceiptAnalysisResponseSchema = z.object({
  supplier: z.string().nullable(),
  receipt_type: z.string().nullable(),
  store: z.string().nullable(),
  receipt_number: z.string().nullable(),
  date: z.string().nullable(),
  total: z.number().nullable(),
  total_discount: z.number().nullable(),
  total_tax: z.number().nullable(),
  subtotal: z.number().nullable(),
  payment_method: z.string().nullable(),
  line_items: z.array(ReceiptAnalysisResponseItemSchema),
  image_results: ReceiptAnalysisImageResultsSchema,
});


/** @deprecated legacy types */

/**
 * Shared back-end types. These mirror the front-end shapes
 * defined in client/src/types/index.ts.
 */

export interface Project {
  id: string;
  name: string;
  phases: string[];
}

export interface LineItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  phase: string;
  aiConfidence?: number;
}

export interface ReceiptAnalysis {
  receiptNumber: string;
  invoiceNumber?: string;
  storeName: string;
  storeNumber?: string;
  purchaseDate: string;
  lineItems: LineItem[];
  subtotal: number;
  deliveryFee: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Receipt extends ReceiptAnalysis {
  id: string;
  internalId: string;
  projectId: string;
  projectName: string;
  lots: string[];
  phases: string[];
  imageBlobUrl: string;
  createdAt: string;
}