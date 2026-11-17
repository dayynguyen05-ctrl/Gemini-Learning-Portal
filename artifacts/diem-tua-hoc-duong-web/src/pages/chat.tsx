/**
 * Trang Chat — giao diện AI chat dạng ChatGPT
 * - Sidebar trái: danh sách cuộc trò chuyện + nút "Cuộc trò chuyện mới"
 * - Khung phải: tin nhắn của cuộc trò chuyện đang chọn
 * - Streaming SSE từ Gemini
 * - Tự động tạo cuộc trò chuyện mới khi gửi tin nhắn đầu tiên
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send, Bot, User, Loader2, Sparkles, Volume2,
  Plus, MessageSquare, Trash2, Menu, X, Camera,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSessionId } from "@/lib/session";
import { sendGeminiMessage, type GeminiImageAttachment } from "@/lib/gemini-chat";
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  getListGeminiConversationsQueryKey,
  type GeminiMessage,
  type GeminiConversation,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Kiểu dữ liệu nội bộ ─────────────────────────────────────────────────────

interface LocalMessage {
  id: number;           // ID tạm trong state (không phải DB id)
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  streaming?: boolean;  // Đang nhận SSE
}

interface SelectedImage {
  base64: GeminiImageAttachment["base64"];
  mimeType: GeminiImageAttachment["mimeType"];
  preview: string;
}

const issueDrafts: Record<string, string> = {
  study: "Mình đang cảm thấy áp lực vì việc học. Bạn có thể lắng nghe và giúp mình tìm cách bắt đầu không?",
  relationships: "Mình đang gặp khó khăn với bạn bè hoặc một mối quan hệ. Mình muốn được lắng nghe.",
  family: "Mình đang có chuyện khiến mình bận tâm trong gia đình. Bạn có thể lắng nghe mình không?",
  emotions: "Dạo này mình thấy lo lắng hoặc buồn nhưng chưa rõ lý do. Bạn có thể lắng nghe mình không?",
  unsure: "Mình chưa biết bắt đầu chia sẻ từ đâu. Bạn có thể hỏi mình vài câu nhẹ nhàng không?",
};

// URL gốc để gọi API (tránh dùng localhost cứng)
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const IMAGE_MESSAGE_PLACEHOLDER = "[Ảnh đã gửi để AI phân tích]";

/** Thu nhỏ ảnh trên thiết bị trước khi gửi, để giảm dung lượng và bảo vệ băng thông. */
async function prepareImage(file: File): Promise<SelectedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Vui lòng chọn một tệp hình ảnh.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Ảnh gốc quá lớn. Vui lòng chọn ảnh dưới 15 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const maxDimension = 1440;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể xử lý ảnh trên thiết bị này.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error("Không thể nén ảnh.")),
        "image/jpeg",
        0.82,
      );
    });
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Không thể đọc ảnh."));
      reader.onerror = () => reject(new Error("Không thể đọc ảnh."));
      reader.readAsDataURL(blob);
    });

    return {
      base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
      mimeType: "image/jpeg",
      preview: dataUrl,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ─── Hàm hỗ trợ ──────────────────────────────────────────────────────────────

/** Chọn giọng đọc tiếng Việt tốt nhất (ưu tiên Ngọc Huyền) */
function pickVietnameseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const vi = voices.filter((v) => v.lang.startsWith("vi"));
  if (vi.length === 0) return null;

  const ngocHuyen = vi.find((v) => {
    const n = v.name.toLowerCase().replace(/[\s-]/g, "");
    return n.includes("ngochuyen") || n.includes("ngọchuyền") || n.includes("huyen");
  });
  if (ngocHuyen) return ngocHuyen;

  const femaleKeywords = ["female", "woman", "thu", "lan", "mai", "huong", "linh"];
  const female = vi.find((v) =>
    femaleKeywords.some((k) => v.name.toLowerCase().includes(k))
  );
  return female ?? vi[0];
}

/** Đọc to văn bản bằng Web Speech API */
function speakVietnamese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // Lọc bỏ ký hiệu markdown trước khi đọc
  const clean = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*/g, "").trim();
  window.speechSynthesis.cancel();

  const speak = () => {
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = "vi-VN";
    utt.rate = 0.82;   // Chậm nhẹ — thân thiện
    utt.pitch = 1.15;  // Cao nhẹ — ấm áp
    utt.volume = 1;
    const voice = pickVietnameseVoice();
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      speak();
    };
  }
}

/** Render markdown bold (**text**) và xuống dòng */
function formatText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Component bong bóng tin nhắn ────────────────────────────────────────────

function MessageBubble({ msg }: { msg: LocalMessage }) {
  const isBot = msg.role === "assistant";
  return (
    <div
      className={`flex ${isBot ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2`}
    >
      <div className={`flex gap-3 max-w-[85%] ${isBot ? "flex-row" : "flex-row-reverse"}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
            isBot
              ? "bg-primary/20 text-primary"
              : "bg-secondary/30 text-secondary-foreground"
          }`}
        >
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          {/* Nội dung tin nhắn */}
          <div
            className={`rounded-2xl px-4 py-2 text-sm sm:text-base leading-relaxed ${
              isBot
                ? "bg-card border border-border/50 text-card-foreground rounded-tl-none shadow-sm"
                : "bg-primary text-primary-foreground rounded-tr-none shadow-md"
            }`}
          >
            {msg.streaming && msg.content === "" ? (
              // Hiệu ứng đang nhập
              <span className="flex items-center gap-1 py-1">
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0.4s" }} />
              </span>
            ) : (
              <>
                {msg.imagePreview && (
                  <img
                    src={msg.imagePreview}
                    alt="Ảnh bạn đã gửi"
                    className="mb-2 max-h-64 max-w-full rounded-xl object-contain"
                  />
                )}
                {formatText(msg.content)}
                {/* Con trỏ nhấp nháy khi đang stream */}
                {msg.streaming && (
                  <span className="inline-block w-[2px] h-[1em] bg-primary/60 ml-[1px] align-middle animate-pulse" />
                )}
              </>
            )}
          </div>

          {/* Nút đọc to (chỉ hiện sau khi bot trả lời xong) */}
          {isBot && !msg.streaming && msg.content && (
            <button
              onClick={() => speakVietnamese(msg.content)}
              title="Nghe đọc"
              className="self-start flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-1 py-0.5 rounded"
            >
              <Volume2 className="w-3 h-3" />
              <span>Nghe</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Component sidebar item cuộc trò chuyện ──────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  onClick,
  onDelete,
}: {
  conv: { id: number; title: string; createdAt: string };
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors ${
        isActive
          ? "bg-primary/15 text-primary"
          : "hover:bg-muted/60 text-foreground/80"
      }`}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
      <span className="flex-1 text-sm truncate">{conv.title}</span>
      {/* Nút xóa — chỉ hiện khi hover */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded hover:text-destructive"
        title="Xóa cuộc trò chuyện"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Component chính ──────────────────────────────────────────────────────────

export default function Chat() {
  const { toast } = useToast();
  const sessionId = getSessionId();
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const localMessagesRef = useRef<LocalMessage[]>([]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const issue = url.searchParams.get("issue");
    const draft = issue ? issueDrafts[issue] : undefined;
    if (!draft) return;

    setInput((current) => current || draft);
    url.searchParams.delete("issue");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  // ── React Query hooks ──────────────────────────────────────────────────────

  // Danh sách tất cả cuộc trò chuyện của session này
  const {
    data: conversationData,
    isLoading: loadingConvs,
  } = useListGeminiConversations(
    { sessionId },
    {
      query: {
        enabled: !!sessionId,
        queryKey: getListGeminiConversationsQueryKey({ sessionId }),
      },
    },
  );
  const conversations: GeminiConversation[] = conversationData ?? [];

  // Tin nhắn của cuộc trò chuyện đang chọn (từ server)
  const {
    data: serverMessages = [],
    isLoading: loadingMessages,
  } = useQuery<GeminiMessage[]>({
    queryKey: ["geminiMessages", activeConvId, sessionId],
    enabled: activeConvId !== null && !!sessionId,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `${BASE_URL}/api/gemini/conversations/${activeConvId}/messages?sessionId=${encodeURIComponent(sessionId)}`,
        { signal },
      );
      const result = await res.json().catch(() => ({})) as GeminiMessage[] | { error?: string };
      if (!res.ok) {
        throw new Error(!Array.isArray(result) && result.error
          ? result.error
          : "Không thể tải lịch sử trò chuyện.");
      }
      return result as GeminiMessage[];
    },
  });

  // Tạo cuộc trò chuyện mới
  const createConv = useCreateGeminiConversation();

  // ── Đồng bộ server messages → local khi chọn conversation ─────────────────
  useEffect(() => {
    if (!activeConvId || loadingMessages || isSending) return;
    const mapped: LocalMessage[] = serverMessages.map((m) => {
      const role = m.role as "user" | "assistant";
      const previousImage = localMessagesRef.current.find(
        (local) => local.imagePreview && local.role === role && local.content === m.content,
      )?.imagePreview;
      return {
        id: m.id,
        role,
        content: m.content,
        imagePreview: previousImage,
      };
    });
    setLocalMessages(mapped);
  }, [activeConvId, serverMessages, loadingMessages, isSending]);

  useEffect(() => {
    localMessagesRef.current = localMessages;
  }, [localMessages]);

  // Reset về empty khi chuyển sang "cuộc trò chuyện mới" (activeConvId = null)
  useEffect(() => {
    if (activeConvId === null) setLocalMessages([]);
  }, [activeConvId]);

  // Auto-scroll khi có tin mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  // ── Xử lý gửi tin nhắn ────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string, imageAttachment = selectedImage) => {
      if ((!text.trim() && !imageAttachment) || isSending) return;

      const trimmed = text.trim();
      const messageContent = trimmed || IMAGE_MESSAGE_PLACEHOLDER;
      setIsSending(true);
      setInput("");
      setSelectedImage(null);

      // Tạo ID tạm cho bubble
      const userMsgId = nextId.current++;
      const botMsgId = nextId.current++;

      // Thêm bubble user và bubble bot (đang stream) ngay lập tức
      setLocalMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content: messageContent,
          imagePreview: imageAttachment?.preview,
        },
        { id: botMsgId, role: "assistant", content: "", streaming: true },
      ]);

      try {
        // ── Bước 1: Đảm bảo có conversation ID ────────────────────────────
        let convId = activeConvId;
        if (!convId) {
          // Tạo tiêu đề từ nội dung đầu tiên hoặc từ ảnh gửi lên.
          const titleSource = trimmed || "Phân tích ảnh";
          const title =
            titleSource.length > 50 ? titleSource.slice(0, 47) + "..." : titleSource;
          const newConv = await createConv.mutateAsync({
            data: { title, sessionId },
          });
          convId = newConv.id;
          setActiveConvId(convId);

          // Cập nhật danh sách conversation trên sidebar
          await queryClient.invalidateQueries({
            queryKey: getListGeminiConversationsQueryKey({ sessionId }),
          });
        }

        // ── Bước 2: Gửi ảnh và nhận văn bản từ SSE stream ────────────────
        if (convId === null) {
          throw new Error("Không thể tạo cuộc trò chuyện.");
        }
        await sendGeminiMessage(
          {
            baseUrl: BASE_URL,
            conversationId: convId,
            sessionId,
            content: trimmed,
            imageAttachment: imageAttachment ?? undefined,
          },
          (content) => {
            setLocalMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, content: m.content + content }
                  : m
              )
            );
          },
        );

        // Đánh dấu bot đã trả lời xong (tắt streaming)
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, streaming: false } : m))
        );

        // Làm mới messages từ server (để có ID thật)
        await queryClient.invalidateQueries({
          queryKey: ["geminiMessages", convId, sessionId],
        });

        setTimeout(() => inputRef.current?.focus(), 100);
      } catch (err) {
        // Giữ tin nhắn văn bản đã gửi; ảnh lỗi được đưa lại vào ô chờ gửi để thử lại.
        setLocalMessages((prev) => prev.filter((m) =>
          m.id !== botMsgId && (!imageAttachment || m.id !== userMsgId),
        ));
        if (imageAttachment) {
          setInput(trimmed);
          setSelectedImage(imageAttachment);
        }
        toast({
          title: "Lỗi kết nối",
          description:
            err instanceof Error
              ? err.message
              : "Không thể gửi tin nhắn. Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    },
    [isSending, sessionId, activeConvId, createConv, queryClient, toast, selectedImage]
  );

  // ── Tạo cuộc trò chuyện mới ────────────────────────────────────────────────
  const handleNewConversation = () => {
    setActiveConvId(null);
    setLocalMessages([]);
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Xóa cuộc trò chuyện ──────────────────────────────────────────────────
  const handleDeleteConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `${BASE_URL}/api/gemini/conversations/${convId}?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Không thể xóa cuộc trò chuyện.");
      }
      if (activeConvId === convId) {
        setActiveConvId(null);
        setLocalMessages([]);
      }
      await queryClient.invalidateQueries({
        queryKey: getListGeminiConversationsQueryKey({ sessionId }),
      });
    } catch (error) {
      toast({
        title: "Không thể xóa",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa cuộc trò chuyện.",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setSelectedImage(await prepareImage(file));
    } catch (error) {
      toast({
        title: "Không thể chọn ảnh",
        description: error instanceof Error ? error.message : "Vui lòng thử một ảnh khác.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  // ── Gợi ý câu hỏi mở đầu ──────────────────────────────────────────────────
  const starterPrompts = [
    "Xin chào Điểm Tựa",
    "Mình thấy áp lực học tập",
    "Mình đang buồn và không biết tại sao",
    "Làm sao để giảm stress?",
  ];

  // ── Sidebar (danh sách cuộc trò chuyện) ───────────────────────────────────
  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border p-3 gap-2">
      {/* Nút tạo cuộc trò chuyện mới */}
      <Button
        onClick={handleNewConversation}
        className="w-full justify-start gap-2 rounded-xl"
        variant="outline"
        size="sm"
      >
        <Plus className="w-4 h-4" />
        Cuộc trò chuyện mới
      </Button>

      {/* Danh sách cuộc trò chuyện */}
      <div className="flex-1 overflow-y-auto space-y-0.5 mt-1">
        {loadingConvs ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 px-2">
            Chưa có cuộc trò chuyện nào.
            <br />Hãy bắt đầu trò chuyện!
          </p>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={{ ...conv, createdAt: conv.createdAt }}
              isActive={activeConvId === conv.id}
              onClick={() => {
                setActiveConvId(conv.id);
                setSidebarOpen(false);
              }}
              onDelete={(e) => handleDeleteConversation(conv.id, e)}
            />
          ))
        )}
      </div>

      {/* Footer sidebar */}
      <div className="border-t border-sidebar-border pt-2 mt-1">
        <p className="text-xs text-muted-foreground text-center px-2">
          Điểm Tựa Học Đường
          <br />
          <span className="opacity-70">Lê Nguyễn — 10A9</span>
        </p>
      </div>
    </aside>
  );

  // ── Render chính ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">

      {/* ── SIDEBAR desktop (luôn hiện) ───────────────────────────────── */}
      <div className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* ── SIDEBAR mobile (overlay khi mở) ──────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* ── KHUNG CHAT CHÍNH ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="bg-card border-b border-border/50 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          {/* Nút mở sidebar (mobile) */}
          <button
            className="md:hidden p-1 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base flex items-center gap-2">
              {activeConvId
                ? (conversations.find((c) => c.id === activeConvId)?.title ?? "Điểm Tựa")
                : "Điểm Tựa"}
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Đang hoạt động · Gemini
            </p>
          </div>

          {/* Nút cuộc trò chuyện mới (desktop shortcut) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex rounded-full"
            onClick={handleNewConversation}
            title="Cuộc trò chuyện mới"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Khu vực tin nhắn */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {loadingMessages && activeConvId ? (
            // Đang tải lịch sử
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : localMessages.length === 0 ? (
            // Màn hình chào khi chưa có tin nhắn
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">
                  Xin chào, mình là Điểm Tựa
                </h2>
                <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                  Mình ở đây để lắng nghe và chia sẻ cùng bạn mọi vui buồn
                  trong cuộc sống học đường. Hãy bắt đầu câu chuyện nhé!
                </p>
              </div>

              {/* Gợi ý câu hỏi mở đầu */}
              <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-md">
                {starterPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs sm:text-sm"
                    onClick={() => handleSend(prompt)}
                    disabled={isSending}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            // Danh sách tin nhắn
            <div className="space-y-4 pb-4 max-w-3xl mx-auto w-full">
              {localMessages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>
          )}
        </div>

        {/* Khu vực nhập liệu */}
        <div className="bg-card border-t border-border/50 p-3 sm:p-4">
          {selectedImage && (
            <div className="max-w-3xl mx-auto w-full mb-3 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-2">
              <img
                src={selectedImage.preview}
                alt="Ảnh sẵn sàng gửi"
                className="h-14 w-14 rounded-lg object-cover"
              />
              <span className="flex-1 text-sm text-muted-foreground">Ảnh đã sẵn sàng gửi cho Gemini</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                disabled={isSending}
                aria-label="Bỏ ảnh đã chọn"
                className="rounded-full p-2 hover:bg-muted disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
            aria-label="Chọn ảnh để gửi Gemini"
          />
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 max-w-3xl mx-auto w-full"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full flex-shrink-0"
              onClick={() => imageInputRef.current?.click()}
              disabled={isSending}
              title="Chụp ảnh hoặc chọn ảnh"
              aria-label="Chụp ảnh hoặc chọn ảnh"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chia sẻ với Điểm Tựa..."
              className="flex-1 rounded-full h-12 px-5 bg-muted/50 border-transparent focus-visible:ring-primary/50 text-base"
              disabled={isSending}
              onKeyDown={(e) => {
                // Ctrl+Enter hoặc Enter (không có Shift) để gửi
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="w-12 h-12 rounded-full flex-shrink-0 shadow-md"
              disabled={(!input.trim() && !selectedImage) || isSending}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
