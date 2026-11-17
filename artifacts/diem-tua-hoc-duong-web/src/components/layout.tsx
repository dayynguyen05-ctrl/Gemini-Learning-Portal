import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Heart, MessageCircle, BookOpen, Smile, PhoneCall, HelpCircle, Menu, X, Music, GraduationCap, Users, LogOut, Compass } from "lucide-react";
import { useState } from "react";
import { SiGoogle } from "react-icons/si";
import { Button } from "./ui/button";

interface LayoutProps {
  children: ReactNode;
}

function AccountAction({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) return null;

  if (isSignedIn) {
    const displayName = user.firstName || user.primaryEmailAddress?.emailAddress || "Tài khoản";
    return (
      <div className={mobile ? "account-action-mobile" : "account-action"}>
        {mobile && <span className="account-name" data-testid="text-account-name">{displayName}</span>}
        {!mobile && <span className="sr-only" data-testid="text-account-name">{displayName}</span>}
        <button
          type="button"
          className="account-button"
          aria-label="Đăng xuất"
          title={`Đăng xuất (${displayName})`}
          data-testid={mobile ? "button-mobile-sign-out" : "button-sign-out"}
          onClick={() => {
            onNavigate?.();
            void signOut({ redirectUrl: import.meta.env.BASE_URL || "/" });
          }}
        >
          <LogOut className="h-4 w-4" />
          {mobile && <span>Đăng xuất</span>}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={mobile ? "account-login-mobile" : "account-login"}
      aria-label="Đăng nhập bằng Google"
      title="Đăng nhập bằng Google"
      data-testid={mobile ? "link-mobile-sign-in" : "link-sign-in"}
      onClick={onNavigate}
    >
      <SiGoogle className="h-4 w-4 shrink-0" aria-hidden="true" />
      {mobile && <span>Đăng nhập bằng Google</span>}
    </Link>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Trang chủ", icon: Heart },
    { href: "/chat", label: "Điểm Tựa (Chatbot)", icon: MessageCircle },
    { href: "/resources", label: "Tài liệu", icon: BookOpen },
    { href: "/career", label: "Hướng nghiệp", icon: Compass },
    { href: "/community", label: "Cộng đồng", icon: Users },
    { href: "/mood", label: "Ghi nhận cảm xúc", icon: Smile },
    { href: "/hotlines", label: "Liên hệ khẩn cấp", icon: PhoneCall },
    { href: "/faq", label: "Hỏi đáp", icon: HelpCircle },
    { href: "/music", label: "Nhạc thư giãn", icon: Music },
    { href: "/vocabulary", label: "Từ điển Anh", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-background selection:bg-secondary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-primary/20 text-primary" />
            </div>
            <span className="whitespace-nowrap font-bold text-lg tracking-tight">Điểm Tựa Học Đường</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex flex-nowrap items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.href.replace("/", "") || "home"}`}
                  className={`whitespace-nowrap px-1.5 py-2 rounded-full text-[0.7rem] font-medium transition-colors flex items-center gap-1 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:block">
            <AccountAction />
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
        
        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background p-4 flex flex-col gap-2 shadow-lg animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.href.replace("/", "") || "home"}`}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-3 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-primary/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <AccountAction mobile onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/50 bg-muted/30 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg text-primary">Điểm Tựa Học Đường</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Không gian an toàn, ấm áp và luôn sẵn sàng hỗ trợ sức khỏe tinh thần cho học sinh, sinh viên.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">
            Được tạo bởi <span className="font-semibold text-primary/70">Lê Nguyễn — 10A9</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
