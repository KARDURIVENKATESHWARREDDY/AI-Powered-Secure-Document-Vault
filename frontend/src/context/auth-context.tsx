"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, fullName: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem("token");
            if (!storedToken) {
                setLoading(false);
                return;
            }

            setToken(storedToken);
            try {
                const userData = await api.getMe();
                setUser(userData);
            } catch {
                localStorage.removeItem("token");
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const data = await api.login(formData);
            localStorage.setItem("token", data.access_token);
            setToken(data.access_token);
            setUser(data.user);
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, fullName: string, password: string) => {
        setLoading(true);
        try {
            await api.register({ email, full_name: fullName, password });
            await login(email, password);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
