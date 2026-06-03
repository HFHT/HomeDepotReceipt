import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Receipt } from '../types';

/**
 * Generates a sequential-looking internal id for a new receipt.
 */
function generateInternalId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `R-${year}-${rand}`;
}

/**
 * POST /api/receipts
 * Persists a finalized receipt and echoes back the stored document.
 *
 * @remarks
 * Stub implementation — replace with a MongoDB `insertOne` into the
 * `receipts` collection.
 */
export async function saveReceipt(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('POST /api/receipts');
  const body = (await req.json().catch(() => null)) as Partial<Receipt> | null;

  if (!body || !body.receiptNumber || !body.projectId) {
    return {
      status: 400,
      jsonBody: { error: 'receiptNumber and projectId are required' }
    };
  }

  const saved: Receipt = {
    ...(body as Receipt),
    id: `rec_${Date.now()}`,
    internalId: generateInternalId(),
    createdAt: new Date().toISOString()
  };

  return { status: 201, jsonBody: saved };
}

app.http('saveReceipt', {
  route: 'receipts',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: saveReceipt
});