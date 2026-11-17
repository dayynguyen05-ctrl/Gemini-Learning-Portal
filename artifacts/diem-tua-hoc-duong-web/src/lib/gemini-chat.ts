export interface GeminiImageAttachment {
  base64: string;
  mimeType: "image/jpeg" | "image/png";
}

interface SendGeminiMessageOptions {
  baseUrl: string;
  conversationId: number;
  sessionId: string;
  content: string;
  imageAttachment?: GeminiImageAttachment;
  fetchImpl?: typeof fetch;
}

/**
 * Sends one chat turn and forwards each text chunk from the SSE response.
 * Image data is included only in this request body, never in local history.
 */
export async function sendGeminiMessage(
  options: SendGeminiMessageOptions,
  onContent: (content: string) => void,
): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `${options.baseUrl}/api/gemini/conversations/${options.conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: options.content,
        sessionId: options.sessionId,
        ...(options.imageAttachment && {
          imageBase64: options.imageAttachment.base64,
          imageMimeType: options.imageAttachment.mimeType,
        }),
      }),
    },
  );

  if (!response.ok || !response.body) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error ?? "Lỗi kết nối với server");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = false;

  const consumeLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data) return;

    let event: { content?: string; done?: boolean; error?: string };
    try {
      event = JSON.parse(data) as typeof event;
    } catch {
      return;
    }
    if (event.error) throw new Error(event.error);
    if (event.done) {
      complete = true;
      return;
    }
    if (event.content) onContent(event.content);
  };

  while (!complete) {
    const { done, value } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      consumeLine(line);
      if (complete) break;
    }
  }

  if (!complete && buffer.trim()) consumeLine(buffer);
}
