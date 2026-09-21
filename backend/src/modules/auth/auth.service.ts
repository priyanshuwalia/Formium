import prisma from "../../config/db.js";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  signEmailVerifyToken,
  verifyRefreshToken,
  verifyTokenOfType,
  passwordFingerprint,
} from "../../utils/tokens.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../lib/email.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Expected, safe-to-surface auth failures. Anything that is not an AuthError
 * (database/Prisma errors, etc.) must be treated as an internal error by the
 * controllers so we never leak stack traces or file paths to clients.
 */
export class AuthError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.name = "AuthError";
        this.status = status;
    }
}

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

const createSession = (userId: string) => {
    const id = randomUUID();
    return prisma.session.create({
        data: { id, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
};

export const revokeSession = (sessionId?: string) => {
    if (!sessionId) return Promise.resolve();
    return prisma.session.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

const revokeAllSessions = (userId: string) =>
    prisma.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } });

const toAuthResponse = async (user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name?: string | null;
    bio?: string | null;
    profilePicture?: string | null;
}) => {
    const session = await createSession(user.id);
    return {
        token: signAccessToken(user.id),
        refreshToken: signRefreshToken(user.id, session.id),
        user: {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name ?? undefined,
            bio: user.bio ?? undefined,
            profilePicture: user.profilePicture ?? undefined,
        },
    };
};

const validateCredentials = (email: unknown, password: unknown) => {
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
        throw new AuthError("Please enter your email and password.", 400);
    }
    if (!EMAIL_REGEX.test(email)) {
        throw new AuthError("Please enter a valid email address.", 400);
    }
};

export const registerUser = async (email: string, password: string) => {
    validateCredentials(email, password);
    if (password.length < 5) {
        throw new AuthError("Password must be at least 5 characters.", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AuthError("An account with this email already exists.", 409);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashedPassword, emailVerified: false },
    });

    const result = await toAuthResponse(user);
    sendVerificationEmail(user.email, signEmailVerifyToken(user.id, user.password)).catch((err) =>
        console.error("Verification email failed:", err),
    );
    return result;
};

export const loginUser = async (email: string, password: string) => {
    validateCredentials(email, password);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AuthError("Incorrect email or password.", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AuthError("Incorrect email or password.", 401);

    return toAuthResponse(user);
};

export const googleLogin = async (accessToken: string) => {
    if (!accessToken) throw new AuthError("Google sign-in is required.", 400);

    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!tokenInfoRes.ok) throw new AuthError("Google sign-in failed. Please try again.", 401);

    const tokenInfo = (await tokenInfoRes.json()) as GoogleTokenInfo;
    const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
    if (!tokenInfo.email || !emailVerified) throw new AuthError("Google sign-in failed. Please try again.", 401);

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = userInfoRes.ok ? ((await userInfoRes.json()) as GoogleUserInfo) : null;

    const existingUser = await prisma.user.findUnique({ where: { email: tokenInfo.email } });
    if (existingUser) {
        // Google already verified this email — backfill the flag on the way in.
        if (!existingUser.emailVerified) {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: true },
            });
        }
        return toAuthResponse({ ...existingUser, emailVerified: true });
    }

    const password = await bcrypt.hash(`google:${userInfo?.sub ?? randomUUID()}:${randomUUID()}`, 10);
    const user = await prisma.user.create({
        data: {
            email: tokenInfo.email,
            password,
            name: userInfo?.name,
            profilePicture: userInfo?.picture,
            emailVerified: true,
        },
    });

    return toAuthResponse(user);
};

export const refreshSession = async (refreshToken?: string) => {
    if (!refreshToken) throw new AuthError("Unauthorized", 401);

    const payload = verifyRefreshToken(refreshToken);
    if (!payload?.id || !payload.sid) throw new AuthError("Unauthorized", 401);

    const session = await prisma.session.findUnique({ where: { id: payload.sid } });
    if (
        !session ||
        session.userId !== payload.id ||
        session.revokedAt !== null ||
        session.expiresAt < new Date()
    ) {
        throw new AuthError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) throw new AuthError("Unauthorized", 401);

    // Rotate: the old refresh token is single-use — revoke it and mint a new one.
    await revokeSession(payload.sid);

    return toAuthResponse(user);
};

export const requestPasswordReset = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always report success to avoid leaking which emails are registered
    if (!user) return;

    const token = signPasswordResetToken(user.id, user.password);
    try {
        await sendPasswordResetEmail(user.email, token);
    } catch (err) {
        console.error("Failed to send password reset email:", err);
    }
};

export const resetPassword = async (token: string, password: string) => {
    const payload = verifyTokenOfType(token, "password-reset");
    if (!payload?.fp) throw new AuthError("This reset link is invalid or has expired", 400);

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || passwordFingerprint(user.password) !== payload.fp) {
        throw new AuthError("This reset link is invalid or has expired", 400);
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    // A changed password invalidates every outstanding session.
    await revokeAllSessions(user.id);

    return toAuthResponse(user);
};

export const verifyEmail = async (token: string) => {
    const payload = verifyTokenOfType(token, "email-verify");
    if (!payload?.id || !payload.fp) {
        throw new AuthError("This verification link is invalid or has expired", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || passwordFingerprint(user.password) !== payload.fp) {
        throw new AuthError("This verification link is invalid or has expired", 400);
    }

    if (user.emailVerified) return;

    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
    });
};

export const resendVerification = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always report success to avoid leaking which emails are registered.
    if (!user || user.emailVerified) return;

    const token = signEmailVerifyToken(user.id, user.password);
    try {
        await sendVerificationEmail(user.email, token);
    } catch (err) {
        console.error("Failed to resend verification email:", err);
    }
};
