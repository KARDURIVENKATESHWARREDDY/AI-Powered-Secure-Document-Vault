"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
    LayoutDashboard, 
    FilePlus, 
    FileText, 
    ShieldAlert, 
    LogOut, 
    Loader2 
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null; // Prevents layout flashing before redirect
    }

    const navItems = [
        { name: "Document Vault", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Knowledge Assistant", path: "/dashboard/chat", icon: <FileText className="w-4 h-4" /> }
    ];

    const isAdmin = user.role === "admin";

    return (
        <div className="min-h-screen bg-[#090d16] flex flex-col md:flex-row select-none">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-[#0b1329] border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between shrink-0">
                <div>
                    {/* Brand Logomark */}
                    <div className="p-6 border-b border-slate-850 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg text-sm">
                            S
                        </div>
                        <div>
                            <span className="font-semibold text-sm tracking-tight text-white block">Secure Vault</span>
                            <span className="text-[10px] text-slate-500 block -mt-1 font-mono">Enterprise AI Doc Vault</span>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="p-4 space-y-1.5">
                        <span className="px-3 text-[10px] font-mono text-slate-500 block mb-2 tracking-wider">WORKSPACE</span>
                        
                        {navItems.map((item) => {
                            const active = pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                        active 
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" 
                                            : "text-slate-400 hover:text-white hover:bg-slate-850"
                                    }`}
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            );
                        })}

                        {/* Admin Link Area */}
                        {isAdmin && (
                            <>
                                <span className="px-3 pt-6 text-[10px] font-mono text-slate-500 block mb-2 tracking-wider">ADMIN CONTROL</span>
                                <Link
                                    href="/dashboard/admin"
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                        pathname === "/dashboard/admin"
                                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/15" 
                                            : "text-slate-400 hover:text-white hover:bg-slate-850"
                                    }`}
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    Security Console
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                {/* Sidebar Footer User detail card */}
                <div className="p-4 border-t border-slate-850">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/40 border border-slate-850 mb-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0">
                            {user.full_name ? user.full_name[0].toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                            <span className="font-semibold text-xs text-white block truncate">{user.full_name || "User"}</span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">{user.email}</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-slate-850 px-6 flex items-center justify-between bg-[#0b1329]/30">
                    <div className="font-semibold text-sm text-slate-300 font-mono">
                        SYSTEM_STATUS: <span className="text-emerald-400">ONLINE</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-2.5 py-0.5 rounded-full bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-400">
                            Tenant: <span className="font-bold text-white">{user.tenant_id || "default_tenant"}</span>
                        </div>
                        <div className="px-2.5 py-0.5 rounded-full bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-400">
                            Role: <span className="font-bold text-white uppercase">{user.role}</span>
                        </div>
                    </div>
                </header>

                {/* Sub-page Render Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
