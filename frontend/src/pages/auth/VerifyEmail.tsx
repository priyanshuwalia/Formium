import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail, resendVerification } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/apiError";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, refresh } = useAuth();

  const [status, setStatus] = useState<"verifying" | "done" | "error">(
    token ? "verifying" : "done",
  );
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const email = user?.email ?? "";

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    verifyEmail(token)
      .then(async () => {
        await refresh();
        if (!cancelled) setStatus("done");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "This verification link is invalid or has expired."));
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    setError("");
    setResent(false);
    try {
      await resendVerification(email || "");
      setResent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not resend the verification email."));
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gray-100 p-4 font-inter">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl lg:p-12">
        <h1 className="text-3xl font-extrabold text-zinc-800">
          {status === "verifying" ? "Verifying your email…" : "Email verification"}
        </h1>

        {status === "error" && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}

        {status === "done" && (
          <p className="mt-4 text-sm text-zinc-500">
            {token
              ? "Your email has been verified. You're all set."
              : "Check your inbox — we've sent you a verification link."}
          </p>
        )}

        {status === "done" && (
          <div className="mt-8 flex flex-col gap-3">
            {!token && (
              <button
                onClick={handleResend}
                disabled={resent}
                className="w-full rounded-md bg-[#0075DE]/90 p-3 font-semibold text-white transition hover:bg-[#006ACD] disabled:opacity-70"
              >
                {resent ? "Sent — check your inbox" : "Resend verification email"}
              </button>
            )}
            <Link
              to="/home"
              className="w-full rounded-md border border-gray-300 p-3 font-semibold text-zinc-700 transition hover:bg-gray-50"
            >
              Go to dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;