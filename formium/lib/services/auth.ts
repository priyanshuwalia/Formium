import { prisma } from "../prisma";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

// Errors that are safe to surface to the client. Anything else (e.g. a raw
// Prisma/database error) must be swallowed by the route handlers so we never
// leak internals or file paths.
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const registerUser = async (email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AuthError("Email already registered");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });
  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthError("Invalid credentials");
  }
  return user;
};

type GoogleTokenInfo = {
  email?: string;
  email_verified?: boolean | string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

export const googleLogin = async (accessToken: string) => {
  if (!accessToken) throw new AuthError("Google access token is required");

  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!tokenInfoRes.ok) throw new AuthError("Invalid Google token");

  const tokenInfo = (await tokenInfoRes.json()) as GoogleTokenInfo;
  const emailVerified =
    tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
  if (!tokenInfo.email || !emailVerified)
    throw new AuthError("Google email is not verified");

  const userInfoRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const userInfo = userInfoRes.ok
    ? ((await userInfoRes.json()) as GoogleUserInfo)
    : null;

  const existingUser = await prisma.user.findUnique({
    where: { email: tokenInfo.email },
  });
  if (existingUser) return existingUser;

  const password = await bcrypt.hash(
    `google:${userInfo?.sub ?? nanoid()}:${nanoid()}`,
    10,
  );
  return prisma.user.create({
    data: {
      email: tokenInfo.email,
      password,
      name: userInfo?.name,
      profilePicture: userInfo?.picture,
    },
  });
};