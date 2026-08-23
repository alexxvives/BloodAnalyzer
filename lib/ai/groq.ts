/**
 * Groq chat model for extraction + action plans.
 * `llama-3.3-70b-versatile` shut down 2026-08-16 on free/developer tiers.
 * @see https://console.groq.com/docs/deprecations
 */
export const GROQ_CHAT_MODEL = "openai/gpt-oss-120b";

/**
 * Free/on_demand `openai/gpt-oss-120b` is 8K TPM. Groq reserves
 * `max_completion_tokens` against that cap at admission, so asking for
 * 8000 completion tokens makes every prompt a 413 ("Limit 8000").
 * 4000 leaves room for gpt-oss reasoning + a full marker JSON payload
 * while prompt + reserved output still fit under 8K.
 * @see https://console.groq.com/docs/rate-limits
 */
export const GROQ_MAX_COMPLETION_TOKENS = 4_000;

type GroqMessage = {
  content?: string | null;
  reasoning?: string | null;
};

type GroqChatResponse = {
  choices?: Array<{ message?: GroqMessage }>;
};

/**
 * JSON-mode body for Groq chat completions.
 * JSON mode cannot use reasoning_format "raw" (Groq returns 400).
 */
export function groqJsonChatBody(input: {
  system: string;
  user: string;
  temperature: number;
  maxCompletionTokens?: number;
}): Record<string, unknown> {
  return {
    model: GROQ_CHAT_MODEL,
    temperature: input.temperature,
    max_completion_tokens:
      input.maxCompletionTokens ?? GROQ_MAX_COMPLETION_TOKENS,
    reasoning_effort: "low",
    reasoning_format: "parsed",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
  };
}

/**
 * Pull JSON text from a Groq chat response.
 * gpt-oss puts the JSON in `content` and chain-of-thought in `reasoning` —
 * never concatenate those fields (JSON.parse then fails on line 2).
 */
export function readGroqJsonText(data: unknown): string {
  const message = (data as GroqChatResponse).choices?.[0]?.message;
  const candidates = [message?.content, message?.reasoning].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );
  if (candidates.length === 0) throw new Error("Empty Groq response");

  let lastError: unknown;
  for (const part of candidates) {
    try {
      return extractJsonText(part);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Groq response was not JSON");
}

/** First complete JSON object/array in a model payload (fences, think tags, trailing prose). */
export function extractJsonText(raw: string): string {
  const cleaned = stripJsonFences(raw);
  if (!cleaned) throw new Error("Empty Groq response");
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // mixed prose + JSON
  }
  const start = cleaned.search(/[\[{]/);
  if (start < 0) throw new SyntaxError("No JSON object in Groq response");
  const end = endOfFirstJsonValue(cleaned.slice(start));
  if (end < 0) throw new SyntaxError("Truncated JSON in Groq response");
  const json = cleaned.slice(start, start + end);
  JSON.parse(json);
  return json;
}

export function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function endOfFirstJsonValue(text: string): number {
  const closer: Record<string, string> = { "{": "}", "[": "]" };
  const first = text[0];
  if (first !== "{" && first !== "[") return -1;
  const stack: string[] = [closer[first]!];
  let inString = false;
  let escape = false;
  for (let i = 1; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{" || ch === "[") {
      stack.push(closer[ch]!);
      continue;
    }
    if (ch === "}" || ch === "]") {
      if (stack.pop() !== ch) return -1;
      if (stack.length === 0) return i + 1;
    }
  }
  return -1;
}
