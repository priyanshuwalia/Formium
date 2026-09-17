import * as AuthService from "./auth.service.js";
import { AuthError } from "./auth.service.js";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const handleError = (res, err, context) => {
    if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    console.error(`${context} error:`, err);
    res.status(500).json({ error: GENERIC_ERROR });
};
export const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await AuthService.registerUser(email, password);
        res.status(201).json(user);
    }
    catch (err) {
        handleError(res, err, "Register");
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.loginUser(email, password);
        res.json(result);
    }
    catch (err) {
        handleError(res, err, "Login");
    }
};
export const googleLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;
        const result = await AuthService.googleLogin(accessToken);
        res.json(result);
    }
    catch (err) {
        handleError(res, err, "Google login");
    }
};
