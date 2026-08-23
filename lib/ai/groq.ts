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
 * Keep this well under 8K so input + reserved output still fit.
 * @see https://console.groq.com/docs/rate-limits
 */
export const GROQ_MAX_COMPLETION_TOKENS = 2_500;

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

/** Pull JSON text from a Groq chat response, including reasoning-model payloads. */
export function readGroqJsonText(data: unknown): string {
  const message = (data as GroqChatResponse).choices?.[0]?.message;
  const raw = [message?.content, message?.reasoning]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n");
  if (!raw.trim()) throw new Error("Empty Groq response");
  return stripJsonFences(raw);
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
