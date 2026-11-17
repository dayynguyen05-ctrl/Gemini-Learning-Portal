import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Heart,
  MessageCircle,
  PhoneCall,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SESSION_KEY = "diem-tua-hoc-duong:issue-prompt-dismissed";

const issueOptions = [
  {
    id: "study",
    label: "Áp lực học tập",
    description: "Bài vở, điểm số hoặc kỳ vọng",
    icon: BookOpen,
  },
  {
    id: "relationships",
    label: "Bạn bè và các mối quan hệ",
    description: "Mâu thuẫn, cô đơn hoặc khó kết nối",
    icon: Users,
  },
  {
    id: "family",
    label: "Chuyện gia đình",
    description: "Điều đang khiến bạn bận tâm ở nhà",
    icon: Heart,
  },
  {
    id: "emotions",
    label: "Cảm xúc và lo lắng",
    description: "Buồn, căng thẳng hoặc chưa rõ lý do",
    icon: MessageCircle,
  },
] as const;

export function IssueIntakeDialog() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // The prompt still closes for this visit when session storage is unavailable.
    }
    setOpen(false);
  };

  const openChat = (issue: string) => {
    dismiss();
    setLocation(`/chat?issue=${issue}`);
  };

  const openHotlines = () => {
    dismiss();
    setLocation("/hotlines");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setOpen(true);
        else dismiss();
      }}
    >
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-xl gap-0 overflow-hidden rounded-2xl border-primary/10 bg-background p-0 shadow-2xl">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 to-background px-5 pb-5 pt-7 sm:px-7 sm:pt-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            Điểm Tựa luôn lắng nghe
          </div>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="pr-7 text-2xl font-bold tracking-tight sm:text-3xl">
              Bạn đang gặp phải vấn đề gì?
            </DialogTitle>
            <DialogDescription className="max-w-md text-sm leading-relaxed">
              Chọn điều gần với bạn nhất để bắt đầu trò chuyện. Bạn có thể bỏ qua
              hoặc sửa lời nhắn trước khi gửi.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {issueOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => openChat(option.id)}
                  className="group flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-border/70 bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  data-testid={`button-issue-${option.id}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => openChat("unsure")}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-primary/25 px-4 py-3 text-left text-sm transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            data-testid="button-issue-unsure"
          >
            <span>
              <span className="block font-semibold text-primary">Mình chưa biết bắt đầu từ đâu</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Trò chuyện tự do với Điểm Tựa</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          </button>

          <div className="flex flex-col-reverse items-center justify-between gap-2 border-t border-border/60 pt-3 sm:flex-row">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid="button-skip-issue-prompt"
            >
              Bỏ qua, mình xem trước
            </button>
            <button
              type="button"
              onClick={openHotlines}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              data-testid="button-issue-hotlines"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              Cần hỗ trợ khẩn cấp
            </button>
          </div>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Lựa chọn của bạn chỉ giúp mở sẵn lời nhắn; nội dung chỉ được gửi khi
            bạn chủ động nhấn gửi.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
