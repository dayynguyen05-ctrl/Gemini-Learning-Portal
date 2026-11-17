// Tệp định tuyến chính của ứng dụng Điểm Tựa Học Đường
import { useEffect, useRef } from "react";
import { ClerkProvider, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { viVN } from "@clerk/localizations";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { SignInPage, SignUpPage, clerkAppearance } from "@/components/auth-pages";
import { UmamiTracker } from "@/components/umami-tracker";

// Nhập tất cả các trang
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Resources from "@/pages/resources";
import ResourceDetail from "@/pages/resource-detail";
import Mood from "@/pages/mood";
import Hotlines from "@/pages/hotlines";
import FAQ from "@/pages/faq";
import MusicPage from "@/pages/music";
import VocabularyPage from "@/pages/vocabulary";
import Community from "@/pages/community";
import CareerGuidance from "@/pages/career-guidance";
import NotFound from "@/pages/not-found";

// Khởi tạo client React Query với cấu hình mặc định
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache dữ liệu 5 phút
      retry: 1,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Thiếu VITE_CLERK_PUBLISHABLE_KEY để khởi tạo đăng nhập.");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) {
        queryClient.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

function MainRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat" component={Chat} />
        <Route path="/resources" component={Resources} />
        <Route path="/resources/:id" component={ResourceDetail} />
        <Route path="/mood" component={Mood} />
        <Route path="/hotlines" component={Hotlines} />
        <Route path="/faq" component={FAQ} />
        <Route path="/music" component={MusicPage} />
        <Route path="/vocabulary" component={VocabularyPage} />
        <Route path="/community" component={Community} />
        <Route path="/career" component={CareerGuidance} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={MainRoutes} />
    </Switch>
  );
}

function ClerkApp() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        ...viVN,
        signIn: {
          ...viVN.signIn,
          start: {
            ...viVN.signIn?.start,
            title: "Chào mừng bạn quay lại",
            subtitle: "Đăng nhập để tiếp tục với Điểm Tựa Học Đường",
          },
        },
        signUp: {
          ...viVN.signUp,
          start: {
            ...viVN.signUp?.start,
            title: "Tạo tài khoản",
            subtitle: "Bắt đầu hành trình cùng Điểm Tựa Học Đường",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <UmamiTracker />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// Component gốc của ứng dụng — cung cấp các Context cho toàn bộ ứng dụng
function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
