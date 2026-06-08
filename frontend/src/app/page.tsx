"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert, Award, Bot, Shield, Eye, Database, Key } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100 selection:bg-blue-500 selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#090d16]/75 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                        S
                    </div>
                    <div>
                        <span className="font-semibold text-lg tracking-tight text-white">Secure Vault</span>
                        <span className="text-xs block text-slate-400 -mt-1 font-mono">Enterprise AI Doc Vault v1.0</span>
                    </div>
                </div>
                
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
                    <a href="#security" className="hover:text-blue-400 transition-colors">Security Architecture</a>
                    <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
                </nav>
                
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                        Sign In
                    </Link>
                    <Link 
                        href="/register" 
                        className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 flex items-center gap-1.5"
                    >
                        Get Started <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative px-6 pt-20 pb-16 text-center max-w-6xl mx-auto flex flex-col items-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/35 text-blue-400 text-xs font-semibold mb-8 animate-pulse">
                    <Bot className="w-3.5 h-3.5" /> AI-Powered Document Intelligence
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl leading-tight text-white">
                    Securely Store, Search, and Query Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Enterprise Knowledge</span>
                </h1>
                
                <p className="text-slate-400 text-base md:text-xl max-w-2xl mb-10 leading-relaxed">
                    An enterprise-grade secure Document Vault featuring multi-tenant isolation, AES-256 storage encryption, automatic PII masking, and multi-agent RAG pipelines with RAGAS quality logs.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-16">
                    <Link 
                        href="/register" 
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 flex items-center justify-center gap-2 text-base"
                    >
                        Deploy Secure Console <ArrowRight className="w-5 h-5" />
                    </Link>
                    <a 
                        href="#security" 
                        className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-base"
                    >
                        Review Security Protocol
                    </a>
                </div>

                {/* Hero Interactive App Mockup */}
                <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-1.5 shadow-2xl shadow-blue-900/20 max-w-4xl relative overflow-hidden">
                    <div className="rounded-xl border border-slate-800/50 bg-[#0b1329]/80 p-6 text-left">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500/80 block"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500/80 block"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500/80 block"></span>
                                <span className="text-xs text-slate-500 font-mono ml-4">vault_orchestrator.py</span>
                            </div>
                            <div className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono">
                                SECURITY RUNNING
                            </div>
                        </div>

                        {/* Agent steps display */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { name: "Upload Agent", desc: "Text Parsing (PDF/DOCX)", status: "completed", color: "from-blue-600 to-indigo-500" },
                                { name: "Classification", desc: "Category Segmentation", status: "completed", color: "from-purple-600 to-pink-500" },
                                { name: "Security Scanner", desc: "Jailbreaks & PII Masking", status: "completed", color: "from-cyan-600 to-teal-500" },
                                { name: "RAG Retrieval", desc: "Tenant-Bounded Query", status: "completed", color: "from-amber-500 to-orange-500" },
                                { name: "Audit Agent", desc: "Access Logs & RAGAS", status: "completed", color: "from-slate-700 to-slate-650" }
                            ].map((agent, i) => (
                                <div key={i} className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group">
                                    <div className={`w-1 h-full absolute left-0 top-0 bg-gradient-to-b ${agent.color}`}></div>
                                    <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                                        {agent.name}
                                        <span className="text-[10px] text-emerald-400 font-mono">✓ Active</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-tight">{agent.desc}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 p-4 rounded-lg bg-slate-950/60 border border-slate-850 font-mono text-xs text-slate-400 h-24 overflow-y-hidden flex flex-col justify-end">
                            <div>[SYSTEM] Ingested document: audit_report.pdf. Size: 2.4MB.</div>
                            <div>[SCANNER] PII detection completed. Located 2 SSNs and 1 Email. Automatically applied masking labels.</div>
                            <div>[CLASSIFIER] Auto classified document under Legal & Compliance.</div>
                            <div className="text-emerald-400 animate-pulse">[ENCRYPTION] Simulated AES-256 key matching. Document encrypted. Chunking vectors injected...</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="px-6 py-20 bg-slate-950/40 border-t border-b border-slate-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Enterprise Document Governance</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            The Vault coordinates separate security and intelligence agents to process documents while assuring data protection compliance.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <Key className="w-6 h-6 text-blue-400" />, title: "Secure AES Storage", desc: "Every document is protected with simulated AES-256 encryption. Read streams require tenant token decryption." },
                            { icon: <Database className="w-6 h-6 text-emerald-400" />, title: "PII & Injection Scan", desc: "The scanning agent automatically identifies and redacts Emails, SSNs, and Credit Cards, and halts jailbreak attempts." },
                            { icon: <Eye className="w-6 h-6 text-purple-400" />, title: "Doc Summarization", desc: "Get automatic AI summaries, takeaways, and Named Entities (NER) extracted immediately upon index." },
                            { icon: <Award className="w-6 h-6 text-amber-400" />, title: "RAGAS Evaluation", desc: "Observability for your RAG queries. View real-time Faithfulness, Precision, Recall, Relevancy, Latency, and Cost metrics." }
                        ].map((feat, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-panel flex flex-col items-start text-left">
                                <div className="p-3 rounded-xl bg-slate-800/60 mb-4">{feat.icon}</div>
                                <h3 className="font-bold text-lg mb-2 text-white">{feat.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Architecture */}
            <section id="security" className="px-6 py-20 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="text-left space-y-6">
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 inline-block">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Multi-Tenant Tenant Isolation</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            To ensure total privacy and prevent organizational leaks, our vault enforces tenant boundaries. Every user registration dynamically binds to a tenant identifier derived from their email domain.
                        </p>
                        <ul className="space-y-3 font-mono text-[11px] text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                DB rows are strictly queried by User Domain partitions.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Vector searches filter matches in ChromaDB using tenant keys.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Role-Based access governs document deletions and policy configs.
                            </li>
                        </ul>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-800 bg-[#0b1329]/60 text-left space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                            <span className="font-bold text-xs text-white font-mono uppercase">Guardrail Policy</span>
                        </div>
                        <div className="space-y-3 font-mono text-[10px] text-slate-400">
                            <div>
                                <span className="text-slate-500 block uppercase">1. Prompt Injection Filter</span>
                                <span className="text-slate-200">Rejects inputs matching: DAN, system bypass, ignore instructions.</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block uppercase">2. Retention & Expiry Rules</span>
                                <span className="text-slate-200">Automatically archives expired documents and cleans indices.</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block uppercase">3. Audited Downloads</span>
                                <span className="text-slate-200">Logs file retrieval operations with actor ID, timestamp, and IP addresses.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="px-6 py-20 bg-slate-950/20 border-t border-slate-900 text-center">
                <h2 className="text-3xl font-bold mb-4">Simple, Scalable Pricing</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-16">
                    Connect your API keys or run mock-generations entirely for free.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                    {[
                        { 
                            name: "Developer Vault", 
                            price: "$0", 
                            sub: "Free Trial",
                            desc: "Perfect for evaluation, mock agents testing, and local developer runs.",
                            features: [
                                "Unlimited mock agent document indexes",
                                "Full interactive dashboard metrics",
                                "Local SQLite / ChromaDB vectors",
                                "Prompt injection guardrail active",
                                "RAGAS evaluation simulations",
                                "AES-256 simulated encryption"
                            ],
                            button: "Launch Developer Console",
                            link: "/register"
                        },
                        { 
                            name: "Enterprise Core", 
                            price: "Custom", 
                            sub: "License-based pricing",
                            desc: "Connect your keys and query production LLM instances at scale.",
                            features: [
                                "Gemini Pro / GPT-4o keys integration",
                                "Real PDF, DOCX layout parsers",
                                "Production PostgreSQL databases",
                                "Persistent ChromaDB clustering",
                                "Granular RBAC editor roles",
                                "Full threat audit logs feed"
                            ],
                            button: "Contact Enterprise",
                            link: "mailto:enterprise@securevault.ai"
                        }
                    ].map((tier, i) => (
                        <div key={i} className={`p-8 rounded-3xl border ${
                            i === 0 ? "border-blue-500/80 bg-blue-500/5 shadow-lg shadow-blue-500/5" : "border-slate-800 bg-slate-900/30"
                        } flex flex-col justify-between`}>
                            <div>
                                <span className="font-bold text-xl block text-white mb-2">{tier.name}</span>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                                    <span className="text-xs text-slate-400">{tier.sub}</span>
                                </div>
                                <p className="text-xs text-slate-400 mb-6 leading-relaxed">{tier.desc}</p>
                                <div className="border-b border-slate-850 pb-6 mb-6"></div>
                                <ul className="space-y-3.5 mb-8">
                                    {tier.features.map((f, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-xs text-slate-350">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 block shrink-0"></span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Link 
                                href={tier.link}
                                className={`w-full text-center py-3 rounded-xl font-medium transition-all text-sm block ${
                                    i === 0 ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-slate-850 hover:bg-slate-800 text-slate-300"
                                }`}
                            >
                                {tier.button}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto border-t border-slate-900 px-6 py-8 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
                <div>© 2026 AI Secure Document Vault. All rights reserved.</div>
                <div className="flex gap-6 mt-4 sm:mt-0">
                    <a href="#" className="hover:text-slate-300">Terms of Use</a>
                    <a href="#" className="hover:text-slate-300">Privacy Policy</a>
                    <a href="#" className="hover:text-slate-300">System Logs</a>
                </div>
            </footer>
        </div>
    );
}
