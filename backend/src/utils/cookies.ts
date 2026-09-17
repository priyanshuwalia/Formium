import { Response } from "express";
import { signAccessToken, signRefreshToken } from "./tokens.js";

export const ACCESS_COOKIE = "formium_access";
export const REFRESH_COOKIE = "formium_refresh";

const isProd = () => process.env.NODE_ENV === "production";

// The frontend and API are deployed on different *.vercel.app hosts, which the
// browser treats as different sites — so production cookies need SameSite=None.
export const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: (isProd() ? "none" : "lax") as "none" | "lax",
  path: "/",
});

export const setAuthCookies = (res: Response, userId: string) => {
  const access = signAccessToken(userId);
  const refresh = signRefreshToken(userId);

  res.cookie(ACCESS_COOKIE, access, {
    ...cookieOptions(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refresh, {
    ...cookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return { access, refresh };
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, cookieOptions());
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
};
