import prisma from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
const JWT_SECRET = process.env.JWT_SECRET;
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
export const registerUser = async (email, password) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
        throw new Error("Email already Registered");
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashedPassword } });
    return toAuthResponse(user);
};
export const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("Invalid Credentials");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        throw new Error("Invalid credentials");
    return toAuthResponse(user);
};
export const googleLogin = async (accessToken) => {
    if (!accessToken)
        throw new Error("Google access token is required");
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!tokenInfoRes.ok)
        throw new Error("Invalid Google token");
    const tokenInfo = (await tokenInfoRes.json());
    const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
    if (!tokenInfo.email || !emailVerified)
        throw new Error("Google email is not verified");
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
