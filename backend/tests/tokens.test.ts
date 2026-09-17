import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyTokenOfType,
  passwordFingerprint,
} from "../src/utils/tokens.js";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-hs256";
});

describe("auth token helpers", () => {
  it("signs and verifies an access token", () => {
    const token = signAccessToken("user-123");
    expect(verifyAccessToken(token)).toMatchObject({ id: "user-123", type: "access" });
  });

  it("signs and verifies a refresh token", () => {
    const token = signRefreshToken("user-456");
    expect(verifyRefreshToken(token)).toMatchObject({ id: "user-456", type: "refresh" });
  });

  it("rejects a refresh token passed to the access verifier", () => {
    const refresh = signRefreshToken("user-789");
    expect(verifyAccessToken(refresh)).toBeNull();
  });

  it("rejects an access token passed to the refresh verifier", () => {
    const access = signAccessToken("user-789");
    expect(verifyRefreshToken(access)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken("user-123");
    const tampered = token.slice(0, -2) + "xx";
    expect(verifyAccessToken(tampered)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ id: "attacker", type: "access" }, "a-different-secret-value", {
      expiresIn: "15m",
    });
    expect(verifyAccessToken(token)).toBeNull();
  });

  it("signs and verifies a password reset token", () => {
    const hash = "hashed-password-value";
    const token = signPasswordResetToken("user-1", hash);
    const payload = verifyTokenOfType(token, "password-reset");
    expect(payload?.id).toBe("user-1");
  });

  it("reset token fingerprint changes when the password hash changes", () => {
    const token = signPasswordResetToken("user-1", "old-hash");
    const payload = verifyTokenOfType(token, "password-reset");
    expect(payload?.fp).toBe(passwordFingerprint("old-hash"));
    expect(payload?.fp).not.toBe(passwordFingerprint("new-hash"));
  });

  it("rejects an access token passed to the reset verifier", () => {
    const access = signAccessToken("user-1");
    expect(verifyTokenOfType(access, "password-reset")).toBeNull();
  });
});
