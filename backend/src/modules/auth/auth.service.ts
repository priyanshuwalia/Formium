import prisma from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET!;

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

const signToken = (userId: string) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "3h" });

const toAuthResponse = (user: {
    id: string;
    email: string;
    name?: string | null;
    bio?: string | null;
    profilePicture?: string | null;
}) => ({
    token: signToken(user.id),
    user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        bio: user.bio ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
    },
});

export const registerUser = async (email: string, password: string) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("Email already Registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashedPassword } })
    return toAuthResponse(user);

};

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid Credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    return toAuthResponse(user);
}

export const googleLogin = async (accessToken: string) => {
    if (!accessToken) throw new Error("Google access token is required");

    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!tokenInfoRes.ok) throw new Error("Invalid Google token");

    const tokenInfo = (await tokenInfoRes.json()) as GoogleTokenInfo;
    const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
    if (!tokenInfo.email || !emailVerified) throw new Error("Google email is not verified");

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = userInfoRes.ok ? ((await userInfoRes.json()) as GoogleUserInfo) : null;

    const existingUser = await prisma.user.findUnique({ where: { email: tokenInfo.email } });
    if (existingUser) return toAuthResponse(existingUser);

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
