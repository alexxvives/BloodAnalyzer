/**
 * Groq chat model for extraction + action plans.
 * `llama-3.3-70b-versatile` shut down 2026-08-16 on free/developer tiers.
 * @see https://console.groq.com/docs/deprecations
 */
export const GROQ_CHAT_MODEL = "openai/gpt-oss-120b";

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
    ...(input.maxCompletionTokens != null
      ? { max_completion_tokens: input.maxCompletionTokens }
      : {}),
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
