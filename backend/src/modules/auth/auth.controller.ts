import * as AuthService from "./auth.service.js"
import { AuthError } from "./auth.service.js"
import { Request, Response } from "express"
import { clearAuthCookies, setAuthCookies } from "../../utils/cookies.js"
import { REFRESH_COOKIE } from "../../utils/cookies.js"

const GENERIC_ERROR = "Something went wrong. Please try again.";

const handleError = (res: Response, err: unknown, context: string) => {
    if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    console.error(`${context} error:`, err);
    res.status(500).json({ error: GENERIC_ERROR });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.registerUser(email, password);
        setAuthCookies(res, result.user.id);
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
        setAuthCookies(res, result.user.id);
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
        setAuthCookies(res, result.user.id);
        res.json(result);
    } catch (err) {
        handleError(res, err, "Google login");
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        const result = await AuthService.refreshSession(refreshToken);
        setAuthCookies(res, result.user.id);
        res.json(result);
    } catch (err) {
        handleError(res, err, "Refresh");
    }
};

export const logout = async (_req: Request, res: Response) => {
    clearAuthCookies(res);
    res.json({ success: true });
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
        setAuthCookies(res, result.user.id);
        res.json(result);
    } catch (err) {
        handleError(res, err, "Reset password");
    }
};
