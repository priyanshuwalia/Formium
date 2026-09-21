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
    emailVerified?: boolean;
};

type AuthContextType = {
    user: User | null;
    initializing: boolean;
    login: (user: User) => void;
    logout: (redirect?: boolean) => void;
    updateUser: (user: User) => void;
    refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);

    const login = useCallback((newUser: User) => {
        setUser(newUser);
    }, []);

    const clearSession = useCallback(() => {
        setUser(null);
    }, []);

    const logout = useCallback(
        (redirect = true) => {
            clearSession();
            // Best-effort: clears the httpOnly cookies + revokes the session server-side
            logoutUser().catch(() => undefined);
            if (redirect && location.pathname !== "/login") {
                navigate("/login", { replace: true });
            }
        },
        [clearSession, location.pathname, navigate],
    );

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
    }, []);

    const refresh = useCallback(async () => {
        try {
            const data = await refreshSession();
            if (data?.user) {
                login(data.user);
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
            const ok = await refresh();
            if (!ok && !cancelled) clearSession();
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

    return (
        <AuthContext.Provider value={{ user, initializing, login, logout, updateUser, refresh }}>
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