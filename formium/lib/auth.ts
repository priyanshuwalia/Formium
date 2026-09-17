import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  profilePicture: string | null;
  plan: string;
  planStatus: string;
  planRenewsAt: Date | null;
};

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "formium-dev-secret-change-me",
  );

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
export const ACCESS_COOKIE = "formium_access";
export const REFRESH_COOKIE = "formium_refresh";

export async function signAccessToken(userId: string) {
  return new SignJWT({ id: userId, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret());
}

export async function signRefreshToken(userId: string) {
  return new SignJWT({ id: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getSecret());
}

// Fingerprint of the current password hash — invalidates reset tokens after a
// password change without needing a DB table.
export const passwordFingerprint = (passwordHash: string) =>
  createHash("sha256").update(passwordHash).digest("hex");

export async function signPasswordResetToken(
  userId: string,
  passwordHash: string,
) {
  return new SignJWT({
    id: userId,
    type: "password-reset",
    fp: passwordFingerprint(passwordHash),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<{ id: string; fp: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "password-reset") return null;
    return { id: payload.id as string, fp: payload.fp as string };
  } catch {
    return null;
  }
}

export async function verifyAccessToken(
  token: string,
): Promise<{ id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "access") return null;
    return { id: payload.id as string };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "refresh") return null;
    return { id: payload.id as string };
  } catch {
    return null;
  }
}

export async function setAuthCookies(userId: string) {
  const cookieStore = await cookies();
  const access = await signAccessToken(userId);
  const refresh = await signRefreshToken(userId);

  cookieStore.set(ACCESS_COOKIE, access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  cookieStore.set(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, "", { maxAge: 0, path: "/" });
  cookieStore.set(REFRESH_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  if (access) {
    const payload = await verifyAccessToken(access);
    if (payload) return payload.id;
  }

  // Access token missing or expired — try refreshing from the refresh cookie
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const payload = await verifyRefreshToken(refresh);
    if (payload) {
      const newAccess = await signAccessToken(payload.id);
      cookieStore.set(ACCESS_COOKIE, newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });
      return payload.id;
    }
  }

  return null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  return userId;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { prisma } = await import("./prisma");
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      profilePicture: true,
      plan: true,
      planStatus: true,
      planRenewsAt: true,
    },
  });
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}