import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AUTH_LOGOUT_EVENT } from "../utils/authEvents";
import { logoutUser, refreshSession } from "../api/auth";

export type User = {
    id: string;
    email: string;
    name?: string;
    bio?: string;
    profilePicture?: string;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    initializing: boolean;
    login: (token: string, user: User) => void;
    logout: (redirect?: boolean) => void;
    updateUser: (user: User) => void;
    refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeJwtExp = (token: string) => {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;

        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
    } catch {
        return null;
    }
};

const readStoredUser = (): User | null => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined") return null;
    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        return null;
    }
};

const readStoredToken = (): string | null => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return null;

    const expiresAt = decodeJwtExp(storedToken);
    if (expiresAt && expiresAt <= Date.now()) return null;

    return storedToken;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(readStoredUser);
    const [token, setToken] = useState<string | null>(readStoredToken);
    const [initializing, setInitializing] = useState(true);

    const login = useCallback((newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
    }, []);

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }, []);

    const logout = useCallback(
        (redirect = true) => {
            clearSession();
            // Best-effort: clears the httpOnly refresh cookie on the server
            logoutUser().catch(() => undefined);
            if (redirect && location.pathname !== "/login") {
                navigate("/login", { replace: true });
            }
        },
        [clearSession, location.pathname, navigate],
    );

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    }, []);

    const refresh = useCallback(async () => {
        try {
            const data = await refreshSession();
            if (data?.token && data?.user) {
                login(data.token, data.user);
                return true;
            }
        } catch {
            // ignore — caller decides whether to clear the session
        }
        return false;
    }, [login]);

    // Restore the session from the httpOnly refresh cookie on first load
    useEffect(() => {
        let cancelled = false;
        const bootstrap = async () => {
            if (!token && readStoredUser()) {
                const ok = await refresh();
                if (!ok && !cancelled) clearSession();
            }
            if (!cancelled) setInitializing(false);
        };
        bootstrap();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleLogout = () => logout();
        window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    }, [logout]);

    // Rotate the access token shortly before it expires
    useEffect(() => {
        if (!token) return;

        const expiresAt = decodeJwtExp(token);
        if (!expiresAt) return;

        const delay = Math.max(expiresAt - Date.now(), 0);
        const timeoutId = window.setTimeout(async () => {
            const ok = await refresh();
            if (!ok) clearSession();
        }, delay + 1000);

        return () => window.clearTimeout(timeoutId);
    }, [token, refresh, clearSession]);

    return (
        <AuthContext.Provider value={{ user, token, initializing, login, logout, updateUser, refresh }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};
