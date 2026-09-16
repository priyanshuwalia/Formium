"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ModeToggle from "@/components/ui/ModeToggle";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAuth } from "@/context/auth/authContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Caught an unknown error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (accessToken: string) => {
    setError("");
    try {
      await loginWithGoogle(accessToken);
      router.push("/complete-profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Caught an unknown error: ${err}`);
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
            <CardTitle className="font-bold text-2xl">Welcome back</CardTitle>
            <CardDescription className="font-semibold text-md">
              Continue building forms with Formium.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/reset-password"
                    className="ml-auto inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <GoogleAuthButton onSuccess={handleGoogle} />
            <div className="border-b w-full py-1"></div>
            <div>
              Don't have an account?{" "}
              <Button variant="link" className="m-0 p-0 gap-0">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}