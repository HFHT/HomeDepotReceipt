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