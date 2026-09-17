import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from "../../components/Input";
import { forgotPassword, resetPassword } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/apiError";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setMessage("If that email is registered, a reset link has been sent.");
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token!, password);
      if (res.data?.token && res.data?.user) {
        login(res.data.token, res.data.user);
      }
      navigate("/home", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "This reset link is invalid or has expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gray-100 p-4 font-inter">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl lg:p-12">
        <h1 className="text-3xl font-extrabold text-zinc-800">
          {token ? "Set a new password" : "Reset your password"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {token
            ? "Choose a new password for your account."
            : "We'll email you a link to reset your password."}
        </p>

        {token ? (
          <form onSubmit={submitNewPassword} className="mt-8 space-y-5">
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#0075DE]/90 p-3 font-semibold text-white transition hover:bg-[#006ACD] disabled:opacity-70"
            >
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        ) : (
          <form onSubmit={requestReset} className="mt-8 space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {message && (
              <p className="text-sm text-green-600">{message}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#0075DE]/90 p-3 font-semibold text-white transition hover:bg-[#006ACD] disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link
            to="/login"
            className="font-semibold text-gray-700 underline hover:text-blue-800"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
