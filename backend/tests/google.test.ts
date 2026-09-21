import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../src/config/db.js", () => ({
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

import { googleLogin } from "../src/modules/auth/auth.service.js";

const okJson = (body: unknown) => ({
  ok: true,
  json: async () => body,
});

describe("googleLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-hs256";
  });

  it("returns the existing user for a verified Google email", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(okJson({ email: "g@test.com", email_verified: "true" }))
        .mockResolvedValueOnce(
          okJson({ email: "g@test.com", name: "G", picture: "pic", sub: "s1" }),
        ),
    );
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "g@test.com" });
    mocks.prisma.user.update.mockResolvedValue({ id: "u1", email: "g@test.com", emailVerified: true });
    mocks.prisma.session.create.mockResolvedValue({ id: "session-1" });

    const result = await googleLogin("good-token");
    expect(result.user).toMatchObject({ id: "u1", email: "g@test.com" });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a user for a new verified Google email", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(okJson({ email: "new@test.com", email_verified: true }))
        .mockResolvedValueOnce(
          okJson({ email: "new@test.com", name: "New", picture: "pic", sub: "s2" }),
        ),
    );
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: "u2",
      ...args.data,
    }));
    mocks.prisma.session.create.mockResolvedValue({ id: "session-2" });

    const result = await googleLogin("good-token");
    expect(result.user.id).toBe("u2");
    expect(mocks.prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "new@test.com", name: "New" }),
    });
    const created = mocks.prisma.user.create.mock.calls[0][0].data;
    expect(created.password).not.toBe("good-token");
    expect((created.password as string).length).toBeGreaterThan(20);
  });

  it("rejects when Google says the token is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    await expect(googleLogin("bad-token")).rejects.toThrow("Google sign-in failed");
  });

  it("rejects an unverified Google email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(okJson({ email: "x@test.com", email_verified: false })),
    );
    await expect(googleLogin("token")).rejects.toThrow("Google sign-in failed");
  });

  it("rejects an empty access token", async () => {
    await expect(googleLogin("")).rejects.toThrow("Google sign-in is required.");
  });
});
