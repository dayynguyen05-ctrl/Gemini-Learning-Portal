// Luồng chat Gemini: lưu lịch sử, hỗ trợ ảnh và trả lời dạng SSE.
import { Router, type Request, type Response } from "express";
import { GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import { db, conversations, messages } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";

const router = Router({ mergeParams: true });
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_TIMEOUT_MS = 45_000;
const MAX_IMAGE_BASE64_LENGTH = 7_000_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const SYSTEM_PROMPT = `Bạn là Điểm Tựa — người bạn đồng hành tâm lý ấm áp dành cho học sinh, sinh viên Việt Nam.

Hãy lắng nghe chân thành, không phán xét; dùng tiếng Việt gần gũi, xưng hô mình-bạn; trả lời ngắn gọn, thực tế và hỏi thêm khi cần.
Bạn không thay thế chuyên gia tâm lý, y tế hay pháp lý. Nếu người dùng có nguy cơ tự làm hại bản thân hoặc đang gặp nguy hiểm, hãy khuyến khích họ đến ngay bên người lớn đáng tin cậy và gọi 111 (bảo vệ trẻ em) hoặc dịch vụ khẩn cấp tại địa phương.`;

function writeSse(res: Response, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getProviderStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const details = error as { status?: unknown; statusCode?: unknown };
  if (typeof details.status === "number") return details.status;
  return typeof details.statusCode === "number" ? details.statusCode : undefined;
}

// GET /gemini/conversations/:id/messages?sessionId=...
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const conversationId = Number(req.params.id);
  const sessionId = String(req.query.sessionId ?? "");
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    res.status(400).json({ error: "Mã cuộc trò chuyện không hợp lệ." });
    return;
  }
  if (!sessionId.trim()) {
    res.status(400).json({ error: "Thiếu mã phiên trò chuyện." });
    return;
  }

  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.sessionId, sessionId),
    ));
  if (!conversation) {
    res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện." });
    return;
  }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
  res.json(rows.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
  })));
});

// POST /gemini/conversations/:id/messages — gửi nội dung và ảnh tuỳ chọn, nhận SSE.
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const conversationId = Number(req.params.id);
  const body = req.body as {
    content?: unknown;
    sessionId?: unknown;
    imageBase64?: unknown;
    imageMimeType?: unknown;
  };
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  const imageMimeType = typeof body.imageMimeType === "string" ? body.imageMimeType : "";

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    res.status(400).json({ error: "Mã cuộc trò chuyện không hợp lệ." });
    return;
  }
  if (!sessionId || sessionId.length > 100) {
    res.status(400).json({ error: "Mã phiên trò chuyện không hợp lệ." });
    return;
  }
  if (!content && !imageBase64) {
    res.status(400).json({ error: "Hãy nhập tin nhắn hoặc đính kèm ảnh." });
    return;
  }
  if (content.length > 4000) {
    res.status(400).json({ error: "Tin nhắn quá dài (tối đa 4.000 ký tự)." });
    return;
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    res.status(413).json({ error: "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn." });
    return;
  }
  if (imageBase64 && (
    !ALLOWED_IMAGE_TYPES.has(imageMimeType) ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)
  )) {
    res.status(400).json({ error: "Định dạng ảnh không được hỗ trợ." });
    return;
  }
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    res.status(503).json({ error: "Gemini chưa được cấu hình. Vui lòng thử lại sau." });
    return;
  }

  // Chỉ cho phép truy cập cuộc trò chuyện thuộc về đúng phiên hiện tại.
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.sessionId, sessionId),
    ));
  if (!conversation) {
    res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện." });
    return;
  }

  // Chỉ lưu nội dung văn bản trong lịch sử; ảnh chỉ được gửi cho Gemini lần này.
  const savedUserContent = content || "[Ảnh đã gửi để AI phân tích]";
  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: savedUserContent,
  });

  const history = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(40);

  const contents = history.map((message, index) => {
    const parts: Part[] = [{ text: message.content }];
    // Ảnh chỉ được đính kèm ở lượt hiện tại, không lưu ảnh trong DB.
    if (imageBase64 && index === history.length - 1) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }
    return {
      role: message.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const abortController = new AbortController();
  let clientDisconnected = false;
  let geminiTimedOut = false;
  const timeoutId = setTimeout(() => {
    geminiTimedOut = true;
    abortController.abort();
  }, GEMINI_TIMEOUT_MS);
  req.on("aborted", () => {
    clientDisconnected = true;
    abortController.abort();
  });
  // Request 'close' thường xảy ra sau khi body đã đọc xong; theo dõi response
  // để chỉ hủy Gemini khi trình duyệt thực sự ngắt kết nối trước khi hoàn tất.
  res.on("close", () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
      abortController.abort();
    }
  });

  let fullResponse = "";
  let assistantMessageSaved = false;
  try {
    const gemini = new GoogleGenAI({ apiKey: geminiApiKey });
    let attempt = 0;
    while (attempt < 2) {
      attempt += 1;
      try {
        const stream = await gemini.models.generateContentStream({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            abortSignal: abortController.signal,
          },
        });
        if (!res.headersSent) {
          res.status(200);
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.flushHeaders();
        }

        for await (const chunk of stream) {
          if (clientDisconnected) break;
          const text = chunk.text ?? "";
          if (!text) continue;
          fullResponse += text;
          writeSse(res, { content: text });
        }
        break;
      } catch (error) {
        if (
          getProviderStatus(error) === 503 &&
          attempt === 1 &&
          !fullResponse &&
          !clientDisconnected &&
          !geminiTimedOut
        ) {
          req.log.warn({ providerStatus: 503 }, "Retrying a busy Gemini stream");
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        throw error;
      }
    }

    if (fullResponse) {
      await db.insert(messages).values({
        conversationId,
        role: "assistant",
        content: fullResponse,
      });
      assistantMessageSaved = true;
    }
    if (!clientDisconnected && !fullResponse.trim()) {
      writeSse(res, {
        error: "Gemini chưa tạo được câu trả lời. Bạn có thể thử gửi lại.",
      });
      writeSse(res, { done: true });
      res.end();
      return;
    }
    if (!clientDisconnected) {
      writeSse(res, { done: true });
      res.end();
    }
  } catch (error) {
    if (clientDisconnected) return;
    if (geminiTimedOut) {
      req.log.error({ timeoutMs: GEMINI_TIMEOUT_MS }, "Gemini request timed out");
    }
    const providerError = error as {
      status?: unknown;
      statusCode?: unknown;
      code?: unknown;
    };
    const providerStatus = getProviderStatus(error);
    req.log.error({
      errorName: error instanceof Error ? error.name : "unknown",
      providerStatus,
      providerCode: typeof providerError.code === "string"
        ? providerError.code
        : undefined,
      timedOut: geminiTimedOut,
    }, "Gemini streaming request failed");
    if (fullResponse.trim() && !assistantMessageSaved) {
      try {
        await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: fullResponse,
        });
        assistantMessageSaved = true;
      } catch {
        req.log.error("Failed to save the partial Gemini response");
      }
    }
    const errorMessage = geminiTimedOut
      ? "Gemini đang phản hồi chậm. Vui lòng thử lại sau ít phút."
      : providerStatus === 429 || providerStatus === 503
        ? fullResponse.trim()
          ? "Gemini đang bận. Phần trả lời hiện có đã được lưu; bạn có thể nhắn để tiếp tục."
          : "Gemini đang bận. Vui lòng thử lại sau ít phút."
        : "Không kết nối được Gemini. Vui lòng thử lại sau.";
    // Lỗi trước khi mở SSE trả JSON; lỗi trong stream trả sự kiện SSE.
    if (!res.headersSent) {
      const responseStatus = geminiTimedOut
        ? 504
        : providerStatus === 429 || providerStatus === 503
          ? providerStatus
          : 502;
      res.status(responseStatus).json({ error: errorMessage });
      return;
    }
    writeSse(res, { error: errorMessage });
    writeSse(res, { done: true });
    res.end();
  } finally {
    clearTimeout(timeoutId);
  }
});

export default router;
