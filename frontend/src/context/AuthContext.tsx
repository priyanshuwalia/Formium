import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AUTH_LOGOUT_EVENT } from "../utils/authEvents";



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
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser || storedUser === "undefined") return null;
        try {
            return JSON.parse(storedUser);
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken) return null;

        const expiresAt = decodeJwtExp(storedToken);
        if (expiresAt && expiresAt <= Date.now()) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return null;
        }

        return storedToken;
    });

    const login = (token: string, user: User) => {
        setToken(token);
        setUser(user);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
    }

    const logout = (redirect = true) => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (redirect && location.pathname !== "/login") {
            navigate("/login", { replace: true });
        }
    }

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    useEffect(() => {
        const handleLogout = () => logout();

        window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    }, [location.pathname]);

    useEffect(() => {
        if (!token) return;

        const expiresAt = decodeJwtExp(token);
        if (!expiresAt) return;

        const timeUntilExpiry = expiresAt - Date.now();
        if (timeUntilExpiry <= 0) {
            logout();
            return;
        }

        const timeoutId = window.setTimeout(() => logout(), timeUntilExpiry);
        return () => window.clearTimeout(timeoutId);
    }, [token, location.pathname]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>

    )
}
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
    return ctx
}
