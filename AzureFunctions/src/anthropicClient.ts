import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

/**
 * Lazily instantiates a singleton Anthropic client using the API key
 * from application settings (ANTHROPIC_API_KEY).
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing required application setting: ANTHROPIC_API_KEY"
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const CLAUDE_MODEL =
  process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";

export const CLAUDE_MAX_TOKENS = Number(
  process.env.CLAUDE_MAX_TOKENS ?? 8192
);