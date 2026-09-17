import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("nanoid", () => ({ nanoid: () => "test-nanoid" }));

import { googleLogin } from "@/lib/services/auth";

const okJson = (body: unknown) => ({
  ok: true,
  json: async () => body,
});

describe("googleLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns the existing user for a verified Google email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          okJson({ email: "g@test.com", email_verified: "true" }),
        )
        .mockResolvedValueOnce(
          okJson({ email: "g@test.com", name: "G", picture: "pic", sub: "s1" }),
        ),
    );
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "g@test.com",
    });

    const user = await googleLogin("good-token");
    expect(user).toEqual({ id: "u1", email: "g@test.com" });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a user for a new verified Google email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          okJson({ email: "new@test.com", email_verified: true }),
        )
        .mockResolvedValueOnce(
          okJson({ email: "new@test.com", name: "New", picture: "pic", sub: "s2" }),
        ),
    );
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockImplementation(async ({ data }) => ({
      id: "u2",
      ...data,
    }));

    const user = await googleLogin("good-token");
    expect(user.id).toBe("u2");
    expect(mocks.prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "new@test.com", name: "New" }),
    });
    // Password must be a non-guessable hash, never the raw Google token
    const created = mocks.prisma.user.create.mock.calls[0][0].data;
    expect(created.password).not.toBe("good-token");
    expect(created.password.length).toBeGreaterThan(20);
  });

  it("rejects when Google says the token is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    await expect(googleLogin("bad-token")).rejects.toThrow("Invalid Google token");
  });

  it("rejects an unverified Google email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        okJson({ email: "x@test.com", email_verified: false }),
      ),
    );
    await expect(googleLogin("token")).rejects.toThrow(
      "Google email is not verified",
    );
  });

  it("rejects an empty access token", async () => {
    await expect(googleLogin("")).rejects.toThrow(
      "Google access token is required",
    );
  });
});