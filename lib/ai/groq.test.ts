import { describe, expect, it } from "vitest";
import {
  GROQ_CHAT_MODEL,
  GROQ_MAX_COMPLETION_TOKENS,
  groqJsonChatBody,
  readGroqJsonText,
} from "./groq";

describe("groq helpers", () => {
  it("uses a live Groq production model id", () => {
    expect(GROQ_CHAT_MODEL).toBe("openai/gpt-oss-120b");
    expect(GROQ_CHAT_MODEL).not.toMatch(/llama-3\.3-70b/);
  });

  it("requests parsed reasoning with JSON object mode", () => {
    const body = groqJsonChatBody({
      system: "sys",
      user: "usr",
      temperature: 0,
    });
    expect(body.model).toBe(GROQ_CHAT_MODEL);
    expect(body.reasoning_format).toBe("parsed");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.max_completion_tokens).toBe(GROQ_MAX_COMPLETION_TOKENS);
  });

  it("keeps reserved completion tokens under Groq free-tier 8K TPM", () => {
    expect(GROQ_MAX_COMPLETION_TOKENS).toBeLessThan(8_000);
    const body = groqJsonChatBody({
      system: "sys",
      user: "usr",
      temperature: 0,
      maxCompletionTokens: 1_024,
    });
    expect(body.max_completion_tokens).toBe(1_024);
  });

  it("reads JSON from content or reasoning", () => {
    expect(
      readGroqJsonText({
        choices: [{ message: { content: '{"ok":true}' } }],
      }),
    ).toBe('{"ok":true}');
    expect(
      readGroqJsonText({
        choices: [{ message: { content: "", reasoning: '{"ok":true}' } }],
      }),
    ).toBe('{"ok":true}');
  });

  it("uses content JSON and ignores sibling reasoning prose", () => {
    expect(
      readGroqJsonText({
        choices: [
          {
            message: {
              content: '{"markers":[{"name":"LDL","value":67.6}]}',
              reasoning: "The user wants every assay extracted from the PDF.",
            },
          },
        ],
      }),
    ).toBe('{"markers":[{"name":"LDL","value":67.6}]}');
  });

  it("extracts the first JSON object when prose follows it", () => {
    expect(
      readGroqJsonText({
        choices: [
          {
            message: {
              content:
                '{"ok":true}\nThe user wants every assay extracted from the PDF.',
            },
          },
        ],
      }),
    ).toBe('{"ok":true}');
  });
});
