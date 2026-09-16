"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  if (typeof window === "undefined") return Promise.resolve();
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
  onError?: (message: string) => void;
};

const GoogleAuthButton = ({ onSuccess, onError }: GoogleAuthButtonProps) => {
  const [loading, setLoading] = useState(false);

  const fail = (message: string) => {
    setLoading(false);
    onError?.(message);
  };

  const handleGoogleAuth = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      fail("Google sign-in is not configured.");
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
            fail(response.error_description || response.error || "Google sign-in failed.");
            return;
          }

          try {
            await onSuccess(response.access_token);
          } catch (error: any) {
            fail(error.message || "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
      });

      tokenClient?.requestAccessToken({ prompt: "select_account" });
    } catch (error: any) {
      fail(error.message || "Google sign-in failed.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={handleGoogleAuth}
      className="w-full"
    >
      {loading ? (
        <Loader2 className="animate-spin h-5 w-5" />
      ) : (
        <>
          <img src="/google.svg" alt="Google" className="mr-2 h-5 w-5" />
          Continue with Google
        </>
      )}
    </Button>
  );
};

export default GoogleAuthButton;