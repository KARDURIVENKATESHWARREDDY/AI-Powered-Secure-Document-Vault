"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const { login, user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(email, password);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
            setError(message);
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#090d16] animated-bg-gradient flex flex-col items-center justify-center p-6 select-none">
            {/* Logomark */}
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-lg">
                    A
                </div>
                <div>
                    <span className="font-semibold text-lg tracking-tight text-white block">Autonomous Agent</span>
                    <span className="text-xs text-slate-400 block -mt-1 font-mono">Report Generator</span>
                </div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-[#0b1329]/95 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-400"></div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-xs text-slate-400 mb-6">Enter your credentials to access your workspace</p>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/35 flex gap-3 items-start text-rose-400 text-xs leading-tight">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">EMAIL ADDRESS</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">PASSWORD</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-blue-600/15 flex items-center justify-center gap-2 mt-6 cursor-pointer"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Signing In..." : "Sign In to Console"}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-400">
                    New to the workspace?{" "}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                        Register developer console
                    </Link>
                </div>
            </div>
            
            <div className="text-center text-[10px] text-slate-600 font-mono mt-8">
                Default Credentials: admin@reportagent.ai / AdminPassword123!
            </div>
        </div>
    );
}
