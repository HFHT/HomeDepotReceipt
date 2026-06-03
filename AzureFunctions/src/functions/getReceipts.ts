import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * GET /api/receipts
 * Returns an empty array for now.
 *
 * @remarks
 * Stub implementation — replace with a MongoDB `find` filtered by the
 * authenticated user's OID.
 */
export async function getReceipts(
  _req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('GET /api/receipts');
  return { status: 200, jsonBody: [] };
}

app.http('getReceipts', {
  route: 'receipts',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getReceipts
});