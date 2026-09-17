import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../src/config/db.js", () => ({
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

import { registerUser, loginUser } from "../src/modules/auth/auth.service.js";

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-hs256";
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
});
