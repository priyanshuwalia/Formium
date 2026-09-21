import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../src/config/db.js", () => ({
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

import { registerUser, loginUser, refreshSession, verifyEmail, resetPassword } from "../src/modules/auth/auth.service.js";
import { signRefreshToken, signEmailVerifyToken } from "../src/utils/tokens.js";

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-hs256";
    mocks.prisma.session.create.mockResolvedValue({ id: "session-1" });
  });

  it("registerUser hashes the password", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: "u1",
      ...args.data,
    }));

    const result = await registerUser("a@b.com", "secret123");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "a@b.com" },
    });
    const created = mocks.prisma.user.create.mock.calls[0][0].data;
    expect(created.password).not.toBe("secret123");
    expect(await bcrypt.compare("secret123", created.password as string)).toBe(true);
    expect(result.user.id).toBe("u1");
    expect(result.token).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("registerUser rejects existing emails", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u1" });

    await expect(registerUser("a@b.com", "secret123")).rejects.toThrow(
      "An account with this email already exists.",
    );
  });

  it("registerUser rejects a short password", async () => {
    await expect(registerUser("a@b.com", "1234")).rejects.toThrow(
      "Password must be at least 5 characters.",
    );
  });

  it("loginUser accepts correct credentials", async () => {
    const hash = await bcrypt.hash("right-password", 10);
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: hash,
    });

    const result = await loginUser("a@b.com", "right-password");
    expect(result.user.id).toBe("u1");
    expect(result.token).toBeTruthy();
  });

  it("loginUser rejects wrong password", async () => {
    const hash = await bcrypt.hash("right-password", 10);
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: hash,
    });

    await expect(loginUser("a@b.com", "wrong-password")).rejects.toThrow(
      "Incorrect email or password.",
    );
  });

  it("registerUser issues a refresh token tied to a session", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: "u1",
      ...args.data,
    }));
    mocks.prisma.session.create.mockResolvedValue({ id: "session-abc" });

    const result = await registerUser("a@b.com", "secret123");
    expect(mocks.prisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "u1" }),
    });
    expect(result.refreshToken).toBeTruthy();
  });

  it("refreshSession rejects a revoked session", async () => {
    const token = signRefreshToken("u1", "revoked-session");
    mocks.prisma.session.findUnique.mockResolvedValue({
      id: "revoked-session",
      userId: "u1",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(refreshSession(token)).rejects.toThrow("Unauthorized");
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("refreshSession rejects a token whose session does not exist", async () => {
    const token = signRefreshToken("u1", "ghost-session");
    mocks.prisma.session.findUnique.mockResolvedValue(null);

    await expect(refreshSession(token)).rejects.toThrow("Unauthorized");
  });

  it("refreshSession rotates: revokes the old session and mints a new one", async () => {
    const token = signRefreshToken("u1", "old-session");
    mocks.prisma.session.findUnique.mockResolvedValue({
      id: "old-session",
      userId: "u1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      emailVerified: true,
    });
    mocks.prisma.session.create.mockResolvedValue({ id: "new-session" });

    const result = await refreshSession(token);
    expect(mocks.prisma.session.updateMany).toHaveBeenCalledWith({
      where: { id: "old-session", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result.refreshToken).toBeTruthy();
  });

  it("refreshSession rejects legacy refresh tokens without a session", async () => {
    const legacy = signRefreshToken("u1", "");
    await expect(refreshSession(legacy)).rejects.toThrow("Unauthorized");
  });

  it("verifyEmail marks the account verified when the token matches", async () => {
    const hash = await bcrypt.hash("password-hash", 10);
    const token = signEmailVerifyToken("u1", hash);
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      password: hash,
      emailVerified: false,
    });

    await verifyEmail(token);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { emailVerified: true },
    });
  });

  it("verifyEmail rejects a token bound to a different password", async () => {
    const token = signEmailVerifyToken("u1", "old-hash");
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      password: "new-hash",
      emailVerified: false,
    });

    await expect(verifyEmail(token)).rejects.toThrow("invalid or has expired");
  });

  it("verifyEmail rejects a tampered token", async () => {
    await expect(verifyEmail("not-a-real-token")).rejects.toThrow("invalid or has expired");
  });

  it("resetPassword revokes all sessions after changing the password", async () => {
    const hash = await bcrypt.hash("old-password", 10);
    const { signPasswordResetToken } = await import("../src/utils/tokens.js");
    const resetToken = signPasswordResetToken("u1", hash);
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: hash,
      emailVerified: true,
    });
    mocks.prisma.session.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.session.create.mockResolvedValue({ id: "fresh-session" });

    await resetPassword(resetToken, "brand-new-password");
    expect(mocks.prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { revokedAt: expect.any(Date) },
    });
    const storedNewHash = mocks.prisma.user.update.mock.calls[0][0].data.password;
    expect(await bcrypt.compare("brand-new-password", storedNewHash)).toBe(true);
  });
});
