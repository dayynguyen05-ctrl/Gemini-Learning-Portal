import { SignIn, SignUp } from "@clerk/react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export const clerkAppearance = {
  theme: "simple" as const,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(174 38% 34%)",
    colorForeground: "hsl(176 34% 17%)",
    colorMutedForeground: "hsl(175 16% 42%)",
    colorDanger: "hsl(0 70% 42%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(38 42% 97%)",
    colorInputForeground: "hsl(176 34% 17%)",
    colorNeutral: "hsl(37 24% 82%)",
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#fffdf9] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#e9e1d4] shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#214642] font-bold",
    headerSubtitle: "text-[#667976]",
    socialButtonsBlockButtonText: "text-[#214642] font-semibold",
    formFieldLabel: "text-[#214642] font-medium",
    footerActionLink: "text-[#286c63] hover:text-[#1f564f] font-semibold",
    footerActionText: "text-[#667976]",
    dividerText: "text-[#71837f]",
    identityPreviewEditButton: "text-[#286c63]",
    formFieldSuccessText: "text-[#286c63]",
    alertText: "text-[#7a3c35]",
    logoBox: "mx-auto",
    logoImage: "object-contain",
    socialButtonsBlockButton: "border-[#ded5c7] hover:bg-[#f2eee6]",
    formButtonPrimary: "bg-[#356f68] hover:bg-[#2b5d57] text-white",
    formFieldInput: "border-[#ded5c7] text-[#214642] focus:ring-[#356f68]",
    footerAction: "text-[#71837f]",
    dividerLine: "bg-[#ded5c7]",
    alert: "bg-[#fff4f1] border-[#e9bdb3]",
    otpCodeFieldInput: "border-[#ded5c7] text-[#214642]",
    formFieldRow: "gap-1.5",
    main: "gap-4",
  },
};

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-page-inner">
        <Link href="/" className="auth-back-link" data-testid="link-auth-home">
          <span aria-hidden="true">←</span> Quay về Điểm Tựa Học Đường
        </Link>
        {children}
      </div>
    </main>
  );
}

export function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </AuthShell>
  );
}

export function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </AuthShell>
  );
}
