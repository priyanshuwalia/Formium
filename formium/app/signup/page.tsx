"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardAction,
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
import { FormEvent, useState } from "react";
import { useAuth } from "@/context/auth/authContext";

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password);
      router.push("/complete-profile");
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
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="font-bold text-2xl">
              Craft intelligent forms
            </CardTitle>
            <CardDescription className="font-semibold text-md">
              Meet Formium, your intuitive form-building partner.
            </CardDescription>
            <CardAction></CardAction>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Label htmlFor="confirm password">Confirm Password</Label>
                <Input
                  id="confirm password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {confirmPassword && !passwordsMatch && !error ? (
                <p className="mt-3 text-red-500">Passwords do not match</p>
              ) : null}
              {error ? <p className="mt-3 text-red-500">{error}</p> : null}
              <Button
                type="submit"
                disabled={!passwordsMatch || !email || loading}
                className="w-full"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <GoogleAuthButton onSuccess={handleGoogle} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
export default SignUpPage;