import prisma from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
const JWT_SECRET = process.env.JWT_SECRET;
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
const signToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "3h" });
const toAuthResponse = (user) => ({
    token: signToken(user.id),
    user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        bio: user.bio ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
    },
});
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
