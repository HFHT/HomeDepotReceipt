/**
 * @file Zustand store for the multi-step Home Depot receipt-capture workflow.
 *
 * Follows the framework's typed-slice + JSDoc store convention (see
 * lib/auth/stores/authStore.ts). This store owns only the receipt workflow
 * state; identity/member selection continues to live in the auth store.
 */

import { create } from 'zustand';
import type {
  CapturedImage,
  EditableField,
  EditableLineItem,
  EditableReceipt,
  LineItemFieldKey,
  ReceiptAnalysisResult,
  ReceiptData,
  ReceiptFieldKey,
} from '../types';

/**
 * Generates a stable client id, falling back when `crypto.randomUUID` is
 * unavailable.
 *
 * @returns A unique id string.
 */
const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Wraps a raw value into an {@link EditableField}, seeding both the initial and
 * current values identically.
 *
 * @typeParam T - The value type.
 * @param value - The seed value.
 * @returns An editable field whose initial and current values match.
 */
const toField = <T>(value: T): EditableField<T> => ({
  initialValue: value,
  currentValue: value,
});

/**
 * Formats a possibly-undefined number/string into a display string for editing.
 *
 * @param value - The raw value from AI.
 * @returns A string suitable for a text input ('' when undefined).
 */
const toText = (value: string | number | undefined): string =>
  value === undefined || value === null ? '' : String(value);

/**
 * Creates an editable line item, optionally seeded from AI data (string form).
 *
 * @param seed - Partial seed values and whether the item is manually added.
 * @returns A new editable line item.
 */
const makeLineItem = (seed?: {
  sku?: string;
  description?: string;
  quantity?: string;
  unitPrice?: string;
  totalPrice?: string;
  isManual?: boolean;
}): EditableLineItem => ({
  id: newId(),
  isManual: seed?.isManual ?? false,
  fields: {
    sku: toField(seed?.sku ?? ''),
    description: toField(seed?.description ?? ''),
    quantity: toField(seed?.quantity ?? ''),
    unitPrice: toField(seed?.unitPrice ?? ''),
    totalPrice: toField(seed?.totalPrice ?? ''),
  },
});

/**
 * Builds an {@link EditableReceipt} from a successful AI result.
 *
 * @param imageId - The correlating image id.
 * @param fileName - The original file name.
 * @param data - The parsed receipt data.
 * @returns A fully populated editable receipt.
 */
const buildEditableReceipt = (
  imageId: string,
  fileName: string,
  data: ReceiptData
): EditableReceipt => ({
  imageId,
  fileName,
  fields: {
    storeNumber: toField(toText(data.storeNumber)),
    purchaseDate: toField(toText(data.purchaseDate)),
    receiptNumber: toField(toText(data.receiptNumber)),
    subtotal: toField(toText(data.subtotal)),
    tax: toField(toText(data.tax)),
    total: toField(toText(data.total)),
    paymentMethod: toField(toText(data.paymentMethod)),
  },
  lineItems: (data.lineItems ?? []).map((item) =>
    makeLineItem({
      sku: toText(item.sku),
      description: toText(item.description),
      quantity: toText(item.quantity),
      unitPrice: toText(item.unitPrice),
      totalPrice: toText(item.totalPrice),
    })
  ),
});

/**
 * State and actions for the receipt-capture workflow.
 */
export interface ReceiptCaptureState {
  /** Selected project / subdivision name. */
  project: string | null;
  /** Free-text lots / project numbers. */
  lotNumbers: string;
  /** Selected phases. */
  phases: string[];
  /** Images captured or selected by the user. */
  images: CapturedImage[];
  /** Whether an AI analysis call is in flight. */
  isAnalyzing: boolean;
  /** Raw per-image AI results (success and failure). */
  results: ReceiptAnalysisResult[];
  /** Editable receipts derived from successful results. */
  editableReceipts: EditableReceipt[];
  /** Whether a persistence call is in flight. */
  isSubmitting: boolean;

  /**
   * Sets the selected project / subdivision.
   * @param project - The chosen project, or `null` to clear.
   */
  setProject: (project: string | null) => void;

  /**
   * Sets the lots / project numbers free text.
   * @param value - The new text value.
   */
  setLotNumbers: (value: string) => void;

  /**
   * Sets the selected phases.
   * @param phases - The chosen phase values.
   */
  setPhases: (phases: string[]) => void;

  /**
   * Appends newly captured/selected files as {@link CapturedImage}s.
   * @param files - The raw files to add.
   */
  addImages: (files: File[]) => void;

  /**
   * Removes an image (and its associated result/receipt) and revokes its
   * preview URL.
   * @param id - The image id to remove.
   */
  removeImage: (id: string) => void;

  /**
   * Sets the analysis flag.
   * @param value - Whether analysis is in progress.
   */
  setAnalyzing: (value: boolean) => void;

  /**
   * Merges a batch of AI results into state, rebuilding editable receipts for
   * any successful results. Existing edits for unaffected images are preserved.
   * @param incoming - The newly returned results to merge.
   */
  mergeResults: (incoming: ReceiptAnalysisResult[]) => void;

  /**
   * Updates a single editable scalar field's current value.
   * @param imageId - The receipt's image id.
   * @param fieldKey - The field being edited.
   * @param value - The new current value.
   */
  updateReceiptField: (
    imageId: string,
    fieldKey: ReceiptFieldKey,
    value: string
  ) => void;

  /**
   * Updates a single line item's field current value.
   * @param imageId - The receipt's image id.
   * @param lineItemId - The line item id.
   * @param fieldKey - The line item field being edited.
   * @param value - The new current value.
   */
  updateLineItemField: (
    imageId: string,
    lineItemId: string,
    fieldKey: LineItemFieldKey,
    value: string
  ) => void;

  /**
   * Appends a new, empty (manual) line item to a receipt.
   * @param imageId - The receipt's image id.
   */
  addLineItem: (imageId: string) => void;

  /**
   * Removes a line item from a receipt.
   * @param imageId - The receipt's image id.
   * @param lineItemId - The line item id to remove.
   */
  removeLineItem: (imageId: string, lineItemId: string) => void;

  /**
   * Sets the submission flag.
   * @param value - Whether persistence is in progress.
   */
  setSubmitting: (value: boolean) => void;

  /** Resets the entire workflow and revokes all preview URLs. */
  reset: () => void;
}

/**
 * Hook exposing the receipt-capture store.
 *
 * @example
 * ```tsx
 * const { project, setProject } = useReceiptCaptureStore();
 * ```
 */
export const useReceiptCaptureStore = create<ReceiptCaptureState>(
  (set, get) => ({
    project: null,
    lotNumbers: '',
    phases: [],
    images: [],
    isAnalyzing: false,
    results: [],
    editableReceipts: [],
    isSubmitting: false,

    /** @inheritdoc */
    setProject: (project) => set({ project }),

    /** @inheritdoc */
    setLotNumbers: (lotNumbers) => set({ lotNumbers }),

    /** @inheritdoc */
    setPhases: (phases) => set({ phases }),

    /** @inheritdoc */
    addImages: (files) =>
      set((state) => ({
        images: [
          ...state.images,
          ...files.map((file) => ({
            id: newId(),
            fileName: file.name || `capture-${Date.now()}.jpg`,
            file,
            previewUrl: URL.createObjectURL(file),
          })),
        ],
      })),

    /** @inheritdoc */
    removeImage: (id) =>
      set((state) => {
        const target = state.images.find((img) => img.id === id);
        if (target) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return {
          images: state.images.filter((img) => img.id !== id),
          results: state.results.filter((r) => r.imageId !== id),
          editableReceipts: state.editableReceipts.filter(
            (r) => r.imageId !== id
          ),
        };
      }),

    /** @inheritdoc */
    setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

    /** @inheritdoc */
    mergeResults: (incoming) =>
      set((state) => {
        const incomingIds = new Set(incoming.map((r) => r.imageId));

        const results: ReceiptAnalysisResult[] = [
          ...state.results.filter((r) => !incomingIds.has(r.imageId)),
          ...incoming,
        ];

        const editableReceipts: EditableReceipt[] = [
          ...state.editableReceipts.filter((r) => !incomingIds.has(r.imageId)),
          ...incoming
            .filter((r) => r.data && !r.error)
            .map((r) =>
              buildEditableReceipt(r.imageId, r.fileName, r.data as ReceiptData)
            ),
        ];

        return { results, editableReceipts };
      }),

    /** @inheritdoc */
    updateReceiptField: (imageId, fieldKey, value) =>
      set((state) => ({
        editableReceipts: state.editableReceipts.map((receipt) =>
          receipt.imageId === imageId
            ? {
                ...receipt,
                fields: {
                  ...receipt.fields,
                  [fieldKey]: {
                    ...receipt.fields[fieldKey],
                    currentValue: value,
                  },
                },
              }
            : receipt
        ),
      })),

    /** @inheritdoc */
    updateLineItemField: (imageId, lineItemId, fieldKey, value) =>
      set((state) => ({
        editableReceipts: state.editableReceipts.map((receipt) =>
          receipt.imageId === imageId
            ? {
                ...receipt,
                lineItems: receipt.lineItems.map((item) =>
                  item.id === lineItemId
                    ? {
                        ...item,
                        fields: {
                          ...item.fields,
                          [fieldKey]: {
                            ...item.fields[fieldKey],
                            currentValue: value,
                          },
                        },
                      }
                    : item
                ),
              }
            : receipt
        ),
      })),

    /** @inheritdoc */
    addLineItem: (imageId) =>
      set((state) => ({
        editableReceipts: state.editableReceipts.map((receipt) =>
          receipt.imageId === imageId
            ? {
                ...receipt,
                lineItems: [
                  ...receipt.lineItems,
                  makeLineItem({ isManual: true }),
                ],
              }
            : receipt
        ),
      })),

    /** @inheritdoc */
    removeLineItem: (imageId, lineItemId) =>
      set((state) => ({
        editableReceipts: state.editableReceipts.map((receipt) =>
          receipt.imageId === imageId
            ? {
                ...receipt,
                lineItems: receipt.lineItems.filter(
                  (item) => item.id !== lineItemId
                ),
              }
            : receipt
        ),
      })),

    /** @inheritdoc */
    setSubmitting: (isSubmitting) => set({ isSubmitting }),

    /** @inheritdoc */
    reset: () => {
      get().images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      set({
        project: null,
        lotNumbers: '',
        phases: [],
        images: [],
        isAnalyzing: false,
        results: [],
        editableReceipts: [],
        isSubmitting: false,
      });
    },
  })
);