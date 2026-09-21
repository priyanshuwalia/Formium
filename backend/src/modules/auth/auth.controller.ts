import * as AuthService from "./auth.service.js"
import { AuthError } from "./auth.service.js"
import { Request, Response } from "express"
import { clearAuthCookies, setAuthCookies, REFRESH_COOKIE } from "../../utils/cookies.js"
import { verifyRefreshToken } from "../../utils/tokens.js"

const GENERIC_ERROR = "Something went wrong. Please try again.";

const handleError = (res: Response, err: unknown, context: string) => {
    if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    console.error(`${context} error:`, err);
    res.status(500).json({ error: GENERIC_ERROR });
};

const cookieLogin = (res: Response, result: { token: string; refreshToken: string }) => {
    setAuthCookies(res, result.token, result.refreshToken);
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.registerUser(email, password);
        cookieLogin(res, result);
        res.status(201).json(result);
    }
    catch (err) {
        handleError(res, err, "Register");
    }
}
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.loginUser(email, password);
        cookieLogin(res, result);
        res.json(result);
    }
    catch (err) {
        handleError(res, err, "Login");
    }
}

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { accessToken } = req.body;
        const result = await AuthService.googleLogin(accessToken);
        cookieLogin(res, result);
        res.json(result);
    } catch (err) {
        handleError(res, err, "Google login");
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        const result = await AuthService.refreshSession(refreshToken);
        cookieLogin(res, result);
        res.json(result);
    } catch (err) {
        handleError(res, err, "Refresh");
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        const payload = refreshToken ? verifyRefreshToken(refreshToken) : null;
        if (payload?.sid) await AuthService.revokeSession(payload.sid);
    } catch (err) {
        console.error("Logout revocation error:", err);
    }
    clearAuthCookies(res);
    res.json({ success: true });
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        await AuthService.verifyEmail(token);
        res.json({ success: true });
    } catch (err) {
        handleError(res, err, "Verify email");
    }
};

export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        await AuthService.resendVerification(email);
        res.json({ success: true });
    } catch (err) {
        handleError(res, err, "Resend verification");
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        await AuthService.requestPasswordReset(email);
        res.json({ success: true });
    } catch (err) {
        handleError(res, err, "Forgot password");
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        const result = await AuthService.resetPassword(token, password);
        cookieLogin(res, result);
        res.json(result);
    } catch (err) {
        handleError(res, err, "Reset password");
    }
};
