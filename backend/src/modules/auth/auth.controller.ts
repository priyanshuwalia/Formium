import * as AuthService from "./auth.service.js"
import { AuthError } from "./auth.service.js"
import { Request, Response } from "express"

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
        const user = await AuthService.registerUser(email, password);

        res.status(201).json(user);
    }
    catch (err) {
        handleError(res, err, "Register");
    }
}
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.loginUser(email, password);
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
        res.json(result);
    } catch (err) {
        handleError(res, err, "Google login");
    }
};
