import { describe, expect, it, vi } from "vitest";
import { sendGeminiMessage } from "./gemini-chat";

describe("sendGeminiMessage with a photo", () => {
  it("sends the resized JPEG and forwards streamed text to the chat", async () => {
    const events = [
      { content: "Mình thấy một " },
      { content: "quyển sách." },
      { done: true },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
    const fetchImpl = vi.fn(async () => new Response(events, {
      headers: { "Content-Type": "text/event-stream" },
    })) as unknown as typeof fetch;
    const onContent = vi.fn();

    await sendGeminiMessage({
      baseUrl: "/school",
      conversationId: 42,
      sessionId: "session-for-test",
      content: "Bạn thấy gì trong ảnh?",
      imageAttachment: { base64: "aGVsbG8=", mimeType: "image/jpeg" },
      fetchImpl,
    }, onContent);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/school/api/gemini/conversations/42/messages");
    expect(JSON.parse(String(init.body))).toEqual({
      content: "Bạn thấy gì trong ảnh?",
      sessionId: "session-for-test",
      imageBase64: "aGVsbG8=",
      imageMimeType: "image/jpeg",
    });
    expect(onContent.mock.calls).toEqual([["Mình thấy một "], ["quyển sách."]]);
  });
});
