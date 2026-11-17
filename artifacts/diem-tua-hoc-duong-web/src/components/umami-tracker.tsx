import { useEffect } from "react";

const DEFAULT_UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

export function UmamiTracker() {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim();
  const scriptUrl =
    import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() || DEFAULT_UMAMI_SCRIPT_URL;

  useEffect(() => {
    if (!import.meta.env.PROD || !websiteId) return;

    let parsedScriptUrl: URL;
    try {
      parsedScriptUrl = new URL(scriptUrl);
    } catch {
      return;
    }

    if (parsedScriptUrl.protocol !== "https:") return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-umami-tracker]",
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.defer = true;
    script.src = parsedScriptUrl.toString();
    script.dataset.websiteId = websiteId;
    script.dataset.umamiTracker = "true";
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [scriptUrl, websiteId]);

  return null;
}
