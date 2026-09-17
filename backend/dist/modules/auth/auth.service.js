import prisma from "../../config/db.js";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { signAccessToken, signRefreshToken, signPasswordResetToken, verifyTokenOfType, passwordFingerprint, } from "../../utils/tokens.js";
import { sendPasswordResetEmail } from "../../lib/email.js";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * Expected, safe-to-surface auth failures. Anything that is not an AuthError
 * (database/Prisma errors, etc.) must be treated as an internal error by the
 * controllers so we never leak stack traces or file paths to clients.
 */
export class AuthError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "AuthError";
        this.status = status;
    }
}
const toAuthResponse = (user) => ({
    token: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
    user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        bio: user.bio ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
    },
});
const validateCredentials = (email, password) => {
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
        throw new AuthError("Please enter your email and password.", 400);
    }
    if (!EMAIL_REGEX.test(email)) {
        throw new AuthError("Please enter a valid email address.", 400);
    }
};
export const registerUser = async (email, password) => {
    validateCredentials(email, password);
    if (password.length < 5) {
        throw new AuthError("Password must be at least 5 characters.", 400);
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
        throw new AuthError("An account with this email already exists.", 409);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashedPassword } });
    return toAuthResponse(user);
};
export const loginUser = async (email, password) => {
    validateCredentials(email, password);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new AuthError("Incorrect email or password.", 401);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        throw new AuthError("Incorrect email or password.", 401);
    return toAuthResponse(user);
};
export const googleLogin = async (accessToken) => {
    if (!accessToken)
        throw new AuthError("Google sign-in is required.", 400);
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!tokenInfoRes.ok)
        throw new AuthError("Google sign-in failed. Please try again.", 401);
    const tokenInfo = (await tokenInfoRes.json());
    const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
    if (!tokenInfo.email || !emailVerified)
        throw new AuthError("Google sign-in failed. Please try again.", 401);
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = userInfoRes.ok ? (await userInfoRes.json()) : null;
    const existingUser = await prisma.user.findUnique({ where: { email: tokenInfo.email } });
    if (existingUser)
        return toAuthResponse(existingUser);
    const password = await bcrypt.hash(`google:${userInfo?.sub ?? randomUUID()}:${randomUUID()}`, 10);
    const user = await prisma.user.create({
        data: {
            email: tokenInfo.email,
            password,
            name: userInfo?.name,
            profilePicture: userInfo?.picture,
        },
    });
    return toAuthResponse(user);
};
export const refreshSession = async (refreshToken) => {
    if (!refreshToken)
        throw new AuthError("Unauthorized", 401);
    const payload = verifyTokenOfType(refreshToken, "refresh");
    if (!payload)
        throw new AuthError("Unauthorized", 401);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user)
        throw new AuthError("Unauthorized", 401);
    return {
        token: signAccessToken(user.id),
        user: {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            bio: user.bio ?? undefined,
            profilePicture: user.profilePicture ?? undefined,
        },
    };
};
export const requestPasswordReset = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always report success to avoid leaking which emails are registered
    if (!user)
        return;
    const token = signPasswordResetToken(user.id, user.password);
    try {
        await sendPasswordResetEmail(user.email, token);
    }
    catch (err) {
        console.error("Failed to send password reset email:", err);
    }
};
export const resetPassword = async (token, password) => {
    const payload = verifyTokenOfType(token, "password-reset");
    if (!payload?.fp)
        throw new AuthError("This reset link is invalid or has expired", 400);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || passwordFingerprint(user.password) !== payload.fp) {
        throw new AuthError("This reset link is invalid or has expired", 400);
    }
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return toAuthResponse(user);
};
