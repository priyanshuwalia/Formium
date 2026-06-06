import { useState } from "react";
import googleIcon from "../assets/google-color-icon.svg";
import { Loader2 } from "lucide-react";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleScript = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Google sign-in.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google sign-in."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

type GoogleAuthButtonProps = {
  onSuccess: (accessToken: string) => Promise<void>;
  onError: (message: string) => void;
};

const GoogleAuthButton = ({ onSuccess, onError }: GoogleAuthButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError("Google sign-in is not configured.");
      return;
    }

    setLoading(true);
    try {
      await loadGoogleScript();
      const tokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: async (response) => {
          if (!response.access_token) {
            setLoading(false);
            onError(response.error_description || response.error || "Google sign-in failed.");
            return;
          }

          try {
            await onSuccess(response.access_token);
          } catch (error: any) {
            onError(error.response?.data?.error || error.message || "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
      });

      tokenClient?.requestAccessToken({ prompt: "select_account" });
    } catch (error: any) {
      setLoading(false);
      onError(error.message || "Google sign-in failed.");
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleGoogleAuth}
      className="flex w-full items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 py-2.5 font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <img src={googleIcon} alt="Google" className="mr-2 h-5 w-5" />
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Continue with Google"}
    </button>
  );
};

export default GoogleAuthButton;
