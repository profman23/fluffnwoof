import Anthropic from '@anthropic-ai/sdk';

// AI Doctor Assist — Anthropic Claude client
// Pattern mirrors config/madarSms.ts: read secret from env, export a configured
// client plus an `isConfigured` flag so callers can fail gracefully when the key
// is missing (e.g. on environments where the feature is intentionally disabled).

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Model is configurable via env; defaults to the most capable model.
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

export const isAnthropicConfigured = !!ANTHROPIC_API_KEY;

// Construct the client only when a key is present. The SDK would otherwise throw
// at first use; this keeps startup clean on environments without the key.
export const anthropic: Anthropic | null = isAnthropicConfigured
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;
