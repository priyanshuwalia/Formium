import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
    const { user } = useAuth();
    const unverified = Boolean(user && !user.emailVerified);

    return (
        <div className="flex w-full min-h-screen bg-gray-50 font-inter transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                {unverified && (
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-sm text-amber-800 flex items-center justify-between gap-4">
                        <span>
                            Please verify your email to secure your account.
                        </span>
                        <Link
                            to="/verify-email"
                            className="font-semibold underline hover:text-amber-900 whitespace-nowrap"
                        >
                            Verify email
                        </Link>
                    </div>
                )}
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout;