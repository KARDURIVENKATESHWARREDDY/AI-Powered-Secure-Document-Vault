"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { api, AdminUser } from "@/lib/api";
import { ShieldAlert, Users, Loader2, ShieldCheck, RefreshCw } from "lucide-react";

interface SecurityEvent {
    status: string;
    action: string;
    created_at: string;
    details: string;
    user_email: string;
    ip_address?: string;
}

export default function AdminPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [usersData, statsData] = await Promise.all([
                api.listAdminUsers(),
                api.getDashboardStats(),
            ]);

            setUsers(usersData);
            setSecurityEvents((statsData as { recent_events?: SecurityEvent[] }).recent_events || []);
        } catch (err) {
            console.error("Failed to load admin workspace data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            if (currentUser?.role !== "admin") {
                setLoading(false);
                return;
            }
            await loadAdminData();
        };

        void initialize();
    }, [currentUser]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingUserId(userId);
        try {
            await api.updateUserRole(userId, newRole);
            await api.listAdminUsers().then(setUsers);
        } catch {
            alert("Failed to update user privilege role.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    if (currentUser?.role !== "admin") {
        return (
            <div className="p-6 text-center text-rose-400 font-mono text-xs">
                ACCESS VIOLATION: ADMINISTRATIVE CREDENTIALS REQUIRED.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Security & Administration</h1>
                    <p className="text-xs text-slate-400">Configure role boundaries (RBAC) and review prompt injection security logs.</p>
                </div>
                <button
                    onClick={loadAdminData}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Workspace
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Users Management Panel */}
                <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800/80 bg-[#0b1329]/50 glass-panel">
                    <div className="flex items-center gap-2.5 mb-4 border-b border-slate-850 pb-3">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">Registered Console Users</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="text-[10px] text-slate-500 font-mono uppercase border-b border-slate-850">
                                <tr>
                                    <th className="pb-3 pr-4">User</th>
                                    <th className="pb-3 px-4">Tenant Domain</th>
                                    <th className="pb-3 px-4">Joined Date</th>
                                    <th className="pb-3 pl-4 text-right">Access Role Privilege</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/40">
                                {users.map((u) => (
                                    <tr key={u.id} className="text-slate-300">
                                        <td className="py-4.5 pr-4">
                                            <span className="font-semibold text-white block">{u.full_name || "Console User"}</span>
                                            <span className="text-[10px] text-slate-500 block font-mono">{u.email}</span>
                                        </td>
                                        <td className="py-4.5 px-4 font-mono text-slate-400">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-750 text-[10px] text-slate-300">
                                                {u.tenant_id || "default_tenant"}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-4 font-mono text-slate-400">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4.5 pl-4 text-right">
                                            {updatingUserId === u.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin inline-block mr-4 text-blue-500" />
                                            ) : (
                                                <select
                                                    value={u.role}
                                                    disabled={u.email === currentUser.email} // Disable editing own role
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="viewer">Viewer</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="admin">Administrator</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Detailed Guardrail Audit Events list */}
                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0b1329]/50 glass-panel">
                    <div className="flex items-center gap-2.5 mb-4 border-b border-slate-850 pb-3">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <h3 className="text-sm font-semibold text-white">Blocked Attack Logs</h3>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {securityEvents
                            .filter(e => e.status === "blocked")
                            .map((e, idx) => (
                                <div key={idx} className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/25 text-[10px] leading-relaxed">
                                    <div className="flex justify-between items-start font-mono mb-1 text-rose-300">
                                        <span className="font-bold uppercase shrink-0">{e.action.replace(/_/g, " ")}</span>
                                        <span className="text-slate-500 shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-slate-400 leading-normal mb-2 font-mono break-all bg-slate-950/40 p-2 rounded border border-slate-900">{e.details}</p>
                                    <div className="text-[9px] text-slate-500 font-mono">
                                        Attacker: {e.user_email} | IP: {e.ip_address || "127.0.0.1"}
                                    </div>
                                </div>
                            ))}

                        {securityEvents.filter(e => e.status === "blocked").length === 0 && (
                            <div className="text-[10px] text-slate-500 text-center py-6">
                                <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                                No threat violations recorded. System fully secure.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
