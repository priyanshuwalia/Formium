"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ModeToggle from "@/components/ui/ModeToggle";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

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
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("If that email is registered, a reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="m-3 absolute right-1">
        <ModeToggle />
      </div>
      <div className="flex items-center min-h-screen justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-bold text-2xl">
              {token ? "Set a new password" : "Reset your password"}
            </CardTitle>
            <CardDescription className="font-semibold text-md">
              {token
                ? "Choose a new password for your account."
                : "We'll email you a link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {token ? (
              <form className="flex flex-col gap-6" onSubmit={submitNewPassword}>
                <div className="grid gap-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Update password"}
                </Button>
              </form>
            ) : (
              <form className="flex flex-col gap-6" onSubmit={requestReset}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {message && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {message}
                  </p>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
                <Link
                  href="/login"
                  className="text-sm text-center text-muted-foreground underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}