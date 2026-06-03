/**
 * @file Shared TypeScript types for the Home Depot receipt-capture feature.
 *
 * These types model the data captured from the user, the images they provide,
 * the AI analysis response, and the editable review structure that retains both
 * the AI-suggested (initial) and user-edited (current) values.
 */

/**
 * A wrapper that retains both the original value supplied by AI and the value
 * after the user has edited it. This allows the backend to audit changes.
 *
 * @typeParam T - The underlying value type.
 */
export interface EditableField<T> {
  /** The value originally returned by the AI analysis (never mutated). */
  initialValue: T;
  /** The value as currently edited by the user. */
  currentValue: T;
}

/** Editable scalar fields exposed for each receipt line item. */
export type LineItemFieldKey =
  | 'sku'
  | 'description'
  | 'quantity'
  | 'unitPrice'
  | 'totalPrice';

/**
 * A receipt line item prepared for editing. Every field retains both the
 * AI-suggested initial value and the user's current value (as strings for
 * consistent input handling).
 */
export interface EditableLineItem {
  /** Stable client-generated id (for keys + targeted edits). */
  id: string;
  /** Editable fields keyed by {@link LineItemFieldKey}. */
  fields: Record<LineItemFieldKey, EditableField<string>>;
  /**
   * `true` when the user added this row (no AI origin). Used so the backend can
   * distinguish manual additions from edited AI rows.
   */
  isManual: boolean;
}

/** An image file the user captured or selected, held in browser memory. */
export interface CapturedImage {
  /** Stable client-generated id used to correlate images and AI results. */
  id: string;
  /** Original file name (or a generated name for camera captures). */
  fileName: string;
  /** The underlying binary file to upload for analysis. */
  file: File;
  /** Object URL used for inline preview. Revoke on removal. */
  previewUrl: string;
}

/** A single line item parsed from a receipt by AI. */
export interface ReceiptLineItem {
  /** Home Depot SKU / item number. */
  sku?: string;
  /** Human-readable item description. */
  description?: string;
  /** Quantity purchased. */
  quantity?: number;
  /** Per-unit price. */
  unitPrice?: number;
  /** Extended line total. */
  totalPrice?: number;
}

/** Receipt-level fields extracted from a single image by AI. */
export interface ReceiptData {
  storeNumber?: string;
  purchaseDate?: string;
  receiptNumber?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  lineItems: ReceiptLineItem[];
}

/**
 * The per-image result returned by the AI analysis service. Exactly one of
 * `data` or `error` is expected to be populated.
 */
export interface ReceiptAnalysisResult {
  /** Correlates back to {@link CapturedImage.id}. */
  imageId: string;
  /** The original file name for display. */
  fileName: string;
  /** Parsed receipt data, or `null` when analysis failed. */
  data: ReceiptData | null;
  /** Failure message for this image, or `null` when analysis succeeded. */
  error: string | null;
}

/** The full payload returned by the AI analysis service. */
export interface ReceiptAnalysisResponse {
  /** One result per submitted image. */
  results: ReceiptAnalysisResult[];
}

/** The set of editable scalar fields exposed on the review form. */
export type ReceiptFieldKey =
  | 'storeNumber'
  | 'purchaseDate'
  | 'receiptNumber'
  | 'subtotal'
  | 'tax'
  | 'total'
  | 'paymentMethod';

/**
 * A receipt prepared for the review/edit step. Scalar fields and line items
 * each retain both the AI-suggested initial value and the user's current value.
 */
export interface EditableReceipt {
  /** Correlates to {@link CapturedImage.id}. */
  imageId: string;
  /** Original file name for display. */
  fileName: string;
  /** Editable scalar fields keyed by {@link ReceiptFieldKey}. */
  fields: Record<ReceiptFieldKey, EditableField<string>>;
  /** Editable line items. */
  lineItems: EditableLineItem[];
}

/**
 * The complete submission persisted to the backend once the user finishes the
 * review step.
 */
export interface ReceiptSubmission {
  /** The selected Habitat member (from the auth store), if any. */
  member: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  /** Selected project / subdivision. */
  project: string;
  /** Free-text lots / project numbers. */
  lotNumbers: string;
  /** Selected phases. */
  phases: string[];
  /** Reviewed receipts including original and edited values. */
  receipts: EditableReceipt[];
  /** ISO timestamp of submission. */
  submittedAt: string;
}