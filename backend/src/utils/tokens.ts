import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const getSecret = () => process.env.JWT_SECRET || "formium-dev-secret-change-me";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";

export type TokenPayload = { id: string; type?: string; fp?: string };

export const signAccessToken = (userId: string) =>
  jwt.sign({ id: userId, type: "access" }, getSecret(), { expiresIn: ACCESS_TTL });

export const signRefreshToken = (userId: string) =>
  jwt.sign({ id: userId, type: "refresh" }, getSecret(), { expiresIn: REFRESH_TTL });

/** Fingerprint of the password hash — invalidates reset tokens after a change. */
export const passwordFingerprint = (passwordHash: string) =>
  createHash("sha256").update(passwordHash).digest("hex");

export const signPasswordResetToken = (userId: string, passwordHash: string) =>
  jwt.sign(
    { id: userId, type: "password-reset", fp: passwordFingerprint(passwordHash) },
    getSecret(),
    { expiresIn: "15m" },
  );

export const verifyTokenOfType = (
  token: string,
  type: string,
): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getSecret()) as TokenPayload;
    if (decoded.type !== type) return null;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Access tokens issued before token "types" existed (legacy localStorage
 * sessions) have no `type` claim, so accept those too.
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getSecret()) as TokenPayload;
    if (decoded.type === "refresh" || decoded.type === "password-reset") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null =>
  verifyTokenOfType(token, "refresh");
