import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";

import { SYSTEM_PROMPT } from "../prompt";
import { getAnthropicClient, CLAUDE_MODEL, CLAUDE_MAX_TOKENS } from "../anthropicClient";
import {
  ReceiptAnalysisRequestSchema,
  ReceiptAnalysisResponseSchema,
  ReceiptAnalysisResponse,
} from "../types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // Anthropic's per-image limit is ~5MB

// Narrow ImageBlockParam["source"] (a union of Base64ImageSource | URLImageSource)
// down to just the base64 variant so we can safely reference `media_type`.
type Base64ImageSource = Extract<
  Anthropic.Messages.ImageBlockParam["source"],
  { type: "base64" }
>;

/**
 * Rough estimate of decoded byte size from a base64 string length,
 * without actually decoding (avoids allocating large buffers just to check).
 */
function estimateBase64ByteLength(base64: string): number {
  const cleaned = base64.replace(/=+$/, "");
  return Math.floor((cleaned.length * 3) / 4);
}

/**
 * Extracts a JSON object from a model response that may (despite instructions)
 * be wrapped in markdown code fences or have leading/trailing whitespace/text.
 */
function extractJsonPayload(text: string): unknown {
  let candidate = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    candidate = fenceMatch[1].trim();
  }

  // Fallback: grab the substring between the first '{' and the last '}'.
  if (!candidate.startsWith("{")) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      candidate = candidate.slice(start, end + 1);
    }
  }

  return JSON.parse(candidate);
}

/**
 * Ensures every line item has a well-formed UUID, generating one server-side
 * if the model omitted it or produced something invalid. This keeps the
 * contract reliable even if the model deviates slightly.
 */
function ensureLineItemIds(response: ReceiptAnalysisResponse): void {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  for (const item of response.line_items) {
    if (!item.id || !uuidPattern.test(item.id)) {
      item.id = randomUUID();
    }
  }
}

async function analyzeReceipt(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // ---------------------------------------------------------------------
  // 1. Parse & validate the request body
  // ---------------------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      status: 400,
      jsonBody: { error: "Request body must be valid JSON." },
    };
  }

  const parsedRequest = ReceiptAnalysisRequestSchema.safeParse(rawBody);
  if (!parsedRequest.success) {
    return {
      status: 400,
      jsonBody: {
        error: "Invalid request payload.",
        details: parsedRequest.error.flatten(),
      },
    };
  }

  const images = parsedRequest.data;

  // Guard against oversized images (Anthropic limit ~5MB per image).
  for (const [index, image] of images.entries()) {
    const estimatedBytes = estimateBase64ByteLength(image.imageBase64);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return {
        status: 400,
        jsonBody: {
          error: `Image at index ${index} exceeds the maximum allowed size of ${MAX_IMAGE_BYTES} bytes.`,
        },
      };
    }
  }

  // ---------------------------------------------------------------------
  // 2. Build the Claude request
  // ---------------------------------------------------------------------
  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = images.map(
    (image) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType as Base64ImageSource["media_type"],
        data: image.imageBase64,
      } satisfies Base64ImageSource,
    })
  );

  const instructionBlock: Anthropic.Messages.TextBlockParam = {
    type: "text",
    text:
      `There are ${images.length} image(s) above, in order (index 0 to ${images.length - 1
      }). ` +
      "Analyze them per the system instructions and return only the JSON object.",
  };

  const anthropic = getAnthropicClient();

  let message: Anthropic.Messages.Message;
  context.log(SYSTEM_PROMPT)
  try {
    message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [...imageBlocks, instructionBlock],
        },
      ],
    });
  } catch (err) {
    context.error("Anthropic API call failed", err);
    return {
      status: 502,
      jsonBody: {
        error: "Failed to reach receipt analysis model.",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }

  // ---------------------------------------------------------------------
  // 3. Extract, parse, and validate the model's JSON response
  // ---------------------------------------------------------------------
  const textBlock = message.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );

  if (!textBlock) {
    context.error("Model response contained no text block", message);
    return {
      status: 502,
      jsonBody: { error: "Model returned no analyzable content." },
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = extractJsonPayload(textBlock.text);
  } catch (err) {
    context.error("Failed to parse JSON from model response", {
      error: err,
      raw: textBlock.text,
    });
    return {
      status: 502,
      jsonBody: {
        error: "Model response was not valid JSON.",
      },
    };
  }

  const parsedResponse = ReceiptAnalysisResponseSchema.safeParse(parsedJson);
  if (!parsedResponse.success) {
    context.error("Model JSON failed schema validation", {
      issues: parsedResponse.error.flatten(),
      raw: parsedJson,
    });
    return {
      status: 502,
      jsonBody: {
        error: "Model response did not match the expected schema.",
        details: parsedResponse.error.flatten(),
      },
    };
  }

  const response: ReceiptAnalysisResponse = parsedResponse.data;

  // Belt-and-suspenders: guarantee valid UUIDs on every line item.
  ensureLineItemIds(response);

  return {
    status: 200,
    jsonBody: response,
  };
}

app.http('analyzeReceipt', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: analyzeReceipt
});