import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("nanoid", () => ({ nanoid: () => "test-nanoid" }));

import bcrypt from "bcryptjs";
import { registerUser, loginUser } from "@/lib/services/auth";

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registerUser hashes the password", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockImplementation(async ({ data }) => ({
      id: "u1",
      ...data,
    }));

    const user = await registerUser("a@b.com", "secret123");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "a@b.com" },
    });
    expect(user.password).not.toBe("secret123");
    expect(await bcrypt.compare("secret123", user.password)).toBe(true);
  });

  it("registerUser rejects existing emails", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u1" });

    await expect(registerUser("a@b.com", "secret123")).rejects.toThrow(
      "Email already registered",
    );
  });

  it("loginUser accepts correct credentials", async () => {
    const hash = await bcrypt.hash("right-password", 10);
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: hash,
    });

    const user = await loginUser("a@b.com", "right-password");
    expect(user.id).toBe("u1");
  });

  it("loginUser rejects wrong password", async () => {
    const hash = await bcrypt.hash("right-password", 10);
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: hash,
    });

    await expect(loginUser("a@b.com", "wrong-password")).rejects.toThrow(
      "Invalid credentials",
    );
  });
});