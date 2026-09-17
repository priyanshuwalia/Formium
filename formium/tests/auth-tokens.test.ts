import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-hs256";
});

describe("auth token helpers", () => {
  it("signs and verifies an access token", async () => {
    const { signAccessToken, verifyAccessToken } = await import("@/lib/auth");
    const token = await signAccessToken("user-123");
    const payload = await verifyAccessToken(token);
    expect(payload).toEqual({ id: "user-123" });
  });

  it("signs and verifies a refresh token", async () => {
    const { signRefreshToken, verifyRefreshToken } = await import("@/lib/auth");
    const token = await signRefreshToken("user-456");
    const payload = await verifyRefreshToken(token);
    expect(payload).toEqual({ id: "user-456" });
  });

  it("rejects a refresh token passed to the access verifier", async () => {
    const { signRefreshToken, verifyAccessToken } = await import("@/lib/auth");
    const refresh = await signRefreshToken("user-789");
    expect(await verifyAccessToken(refresh)).toBeNull();
  });

  it("rejects an access token passed to the refresh verifier", async () => {
    const { signAccessToken, verifyRefreshToken } = await import("@/lib/auth");
    const access = await signAccessToken("user-789");
    expect(await verifyRefreshToken(access)).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const { signAccessToken, verifyAccessToken } = await import("@/lib/auth");
    const token = await signAccessToken("user-123");
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifyAccessToken(tampered)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { SignJWT } = await import("jose");
    const token = await new SignJWT({ id: "attacker", type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode("a-different-secret-value"));
    const { verifyAccessToken } = await import("@/lib/auth");
    expect(await verifyAccessToken(token)).toBeNull();
  });

  it("signs and verifies a password reset token", async () => {
    const { signPasswordResetToken, verifyPasswordResetToken } =
      await import("@/lib/auth");
    const hash = "hashed-password-value";
    const token = await signPasswordResetToken("user-1", hash);
    const payload = await verifyPasswordResetToken(token);
    expect(payload?.id).toBe("user-1");
  });

  it("reset token fingerprint changes when the password hash changes", async () => {
    const { signPasswordResetToken, verifyPasswordResetToken } =
      await import("@/lib/auth");
    const token = await signPasswordResetToken("user-1", "old-hash");
    const payload = await verifyPasswordResetToken(token);
    const { passwordFingerprint } = await import("@/lib/auth");
    // Simulates: token issued for old-hash, but a different password is now set
    expect(payload?.fp).toBe(passwordFingerprint("old-hash"));
    expect(payload?.fp).not.toBe(passwordFingerprint("new-hash"));
  });

  it("rejects an access token passed to the reset verifier", async () => {
    const { signAccessToken, verifyPasswordResetToken } = await import(
      "@/lib/auth"
    );
    const access = await signAccessToken("user-1");
    expect(await verifyPasswordResetToken(access)).toBeNull();
  });
});