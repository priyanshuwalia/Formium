import jwt from "jsonwebtoken";
import { createHash } from "crypto";
const getSecret = () => process.env.JWT_SECRET || "formium-dev-secret-change-me";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";
export const signAccessToken = (userId) => jwt.sign({ id: userId, type: "access" }, getSecret(), { expiresIn: ACCESS_TTL });
export const signRefreshToken = (userId) => jwt.sign({ id: userId, type: "refresh" }, getSecret(), { expiresIn: REFRESH_TTL });
/** Fingerprint of the password hash — invalidates reset tokens after a change. */
export const passwordFingerprint = (passwordHash) => createHash("sha256").update(passwordHash).digest("hex");
export const signPasswordResetToken = (userId, passwordHash) => jwt.sign({ id: userId, type: "password-reset", fp: passwordFingerprint(passwordHash) }, getSecret(), { expiresIn: "15m" });
export const verifyTokenOfType = (token, type) => {
    try {
        const decoded = jwt.verify(token, getSecret());
        if (decoded.type !== type)
            return null;
        return decoded;
    }
    catch {
        return null;
    }
};
/**
 * Access tokens issued before token "types" existed (legacy localStorage
 * sessions) have no `type` claim, so accept those too.
 */
export const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, getSecret());
        if (decoded.type === "refresh" || decoded.type === "password-reset") {
            return null;
        }
        return decoded;
    }
    catch {
        return null;
    }
};
export const verifyRefreshToken = (token) => verifyTokenOfType(token, "refresh");
