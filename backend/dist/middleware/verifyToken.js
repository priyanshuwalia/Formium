import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions, } from "../utils/cookies.js";
import { signAccessToken, verifyAccessToken, verifyRefreshToken, } from "../utils/tokens.js";
/**
 * Accepts an access token from either the `Authorization: Bearer` header
 * (Safari/ITP-safe fallback) or the httpOnly cookie, transparently rotating
 * the access cookie from the refresh cookie when it has expired.
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;
    const access = bearer || req.cookies?.[ACCESS_COOKIE];
    if (access) {
        const payload = verifyAccessToken(access);
        if (payload) {
            req.user = { id: payload.id };
            next();
            return;
        }
    }
    const refresh = req.cookies?.[REFRESH_COOKIE];
    if (refresh) {
        const payload = verifyRefreshToken(refresh);
        if (payload) {
            res.cookie(ACCESS_COOKIE, signAccessToken(payload.id), {
                ...cookieOptions(),
                maxAge: 15 * 60 * 1000,
            });
            req.user = { id: payload.id };
            next();
            return;
        }
    }
    res.status(401).json({ error: "Unauthorized" });
};
