import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { buildDummyAnalysis } from '../data/dummyData';

/**
 * POST /api/receipts/analyze
 * Body: { blobUrl: string; phases: string[] }
 *
 * Returns a {@link ReceiptAnalysis} extracted by Claude AI. The stub
 * implementation returns a deterministic dummy payload whose line-item
 * phases are biased toward the phases provided by the caller.
 *
 * @remarks
 * Replace with an Anthropic Messages API call using the configured
 * model (e.g. `claude-sonnet-4-5`) when wiring up production AI.
 */
export async function analyzeReceipt(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('POST /api/receipts/analyze');
  const body = (await req.json().catch(() => ({}))) as {
    blobUrl?: string;
    phases?: string[];
  };

  if (!body.blobUrl) {
    return { status: 400, jsonBody: { error: 'blobUrl is required' } };
  }

  // Simulate latency
  await new Promise((r) => setTimeout(r, 1200));

  const analysis = buildDummyAnalysis(body.phases ?? []);
  return { status: 200, jsonBody: analysis };
}

app.http('analyzeReceipt', {
  route: 'receipts/analyze',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: analyzeReceipt
});