"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
    Send,
    Loader2,
    BookOpen,
    ShieldAlert,
    Gauge,
    Clock,
    DollarSign,
    Cpu,
    CheckCircle2,
    ChevronRight,
    MessageSquare,
    Sparkles
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    citations?: Array<{ source: string; text_snippet: string }>;
    evaluation?: {
        faithfulness: number;
        context_precision: number;
        context_recall: number;
        answer_relevancy: number;
        hallucination_rate: number;
        confidence_score: number;
        latency_ms: number;
        token_count: number;
        estimated_cost: number;
    };
    blocked?: boolean;
}

export default function ChatPage() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I am your AI Knowledge Assistant. Ask me anything about the documents stored in your secure vault. I will provide citation-backed answers and detail our RAGAS evaluation scores.",
        }
    ]);
    const [sending, setSending] = useState(false);
    
    // Vault documents selection
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<Record<string, boolean>>({});
    const [loadingDocs, setLoadingDocs] = useState(true);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const data = await api.listDocuments();
                setDocuments(data);
                // Auto-select all by default
                const initialSelected: Record<string, boolean> = {};
                data.forEach((d: any) => {
                    initialSelected[d.id] = true;
                });
                setSelectedDocs(initialSelected);
            } catch (error) {
                console.error("Failed to load documents for chat filtering", error);
            } finally {
                setLoadingDocs(false);
            }
        };
        fetchDocs();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleToggleDoc = (id: string) => {
        setSelectedDocs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || sending) return;

        const userMsgText = query;
        setQuery("");
        setSending(true);

        const newMsgId = Math.random().toString();
        
        // Append user query
        setMessages(prev => [
            ...prev,
            { id: newMsgId, role: "user", content: userMsgText }
        ]);

        try {
            // Call RAG chat workflow
            const response = await api.queryChat(userMsgText);
            
            const isBlocked = response.answer.startsWith("Blocked by Security Layer");
            
            setMessages(prev => [
                ...prev,
                {
                    id: Math.random().toString(),
                    role: "assistant",
                    content: response.answer,
                    citations: response.citations,
                    evaluation: response.evaluation,
                    blocked: isBlocked
                }
            ]);
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                {
                    id: Math.random().toString(),
                    role: "assistant",
                    content: `Error querying knowledge base: ${err.message || "Failed to process RAG workflow"}`,
                    blocked: true
                }
            ]);
        } finally {
            setSending(false);
        }
    };

    // Get last assistant evaluation to show on right-side console
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant" && m.evaluation);
    const activeEval = lastAssistantMsg?.evaluation;

    return (
        <div className="flex flex-col lg:flex-row gap-6 select-none h-[calc(100vh-8.5rem)] select-none">
            
            {/* Left Sidebar - Documents Selection */}
            <aside className="w-full lg:w-72 bg-[#0b1329]/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shrink-0 glass-panel overflow-y-auto">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">Vault Context Filter</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">Select which documents from your active tenant the Knowledge Agent can retrieve context from.</p>
                    
                    <div className="border-b border-slate-850 my-2"></div>
                    
                    {loadingDocs ? (
                        <div className="py-8 flex justify-center">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-slate-500">
                            No documents uploaded in this tenant. Upload documents in the Vault first to chat.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-72 lg:max-h-none overflow-y-auto">
                            {documents.map((doc) => (
                                <label 
                                    key={doc.id} 
                                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                                        selectedDocs[doc.id] 
                                            ? "border-blue-500/30 bg-blue-500/5 text-slate-200" 
                                            : "border-slate-850 hover:border-slate-800 text-slate-450"
                                    }`}
                                >
                                    <input 
                                        type="checkbox"
                                        checked={!!selectedDocs[doc.id]}
                                        onChange={() => handleToggleDoc(doc.id)}
                                        className="mt-0.5 accent-blue-500 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <span className="font-semibold block truncate leading-tight">{doc.filename}</span>
                                        <span className="text-[9px] font-mono text-slate-500 uppercase">{doc.category}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-[10px] leading-relaxed text-slate-500 font-mono mt-4">
                    Tenant isolation: <strong className="text-slate-400">ENABLED</strong>. Cross-tenant retrieval is strictly blocked at vector store query.
                </div>
            </aside>

            {/* Middle Section - Chat Dialog Box */}
            <main className="flex-1 bg-[#0b1329]/30 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden glass-panel relative">
                
                {/* Messages Panel */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[calc(100vh-16rem)]">
                    {messages.map((msg) => {
                        const isUser = msg.role === "user";
                        return (
                            <div 
                                key={msg.id}
                                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed relative group transition-all ${
                                    isUser 
                                        ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/10" 
                                        : msg.blocked
                                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-bl-none"
                                            : "bg-[#0b1329] border border-slate-850 text-slate-200 rounded-bl-none"
                                }`}>
                                    
                                    {/* Sender Badge */}
                                    <span className="text-[9px] font-mono text-slate-500 block mb-1 uppercase tracking-wider">
                                        {isUser ? "User Client" : msg.blocked ? "Security Shield" : "Knowledge Agent"}
                                    </span>
                                    
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    
                                    {/* Citations list */}
                                    {!isUser && msg.citations && msg.citations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-850/60 space-y-1">
                                            <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500 block">Sources Referenced</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {msg.citations.map((cite, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className="relative group/cite inline-block"
                                                    >
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-750 text-[10px] text-blue-400 font-mono cursor-help">
                                                            [{idx + 1}] {cite.source.substring(0, 15)}...
                                                        </span>
                                                        
                                                        {/* Citation overlay hover tooltip */}
                                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/cite:block z-30 w-72 p-3 bg-slate-900 border border-slate-700 text-[10px] font-mono rounded-lg text-slate-300 shadow-2xl leading-normal">
                                                            <div className="font-bold text-white mb-1 border-b border-slate-800 pb-1">{cite.source}</div>
                                                            <div className="text-slate-400 italic">"{cite.text_snippet}"</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {sending && (
                        <div className="flex justify-start">
                            <div className="bg-[#0b1329] border border-slate-850 rounded-2xl rounded-bl-none p-4 max-w-sm flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-xs text-slate-400 font-mono">Agent querying vector index...</span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <form 
                    onSubmit={handleSend}
                    className="p-4 border-t border-slate-850 bg-[#090d16]/30 flex items-center gap-3"
                >
                    <input 
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={documents.length === 0 ? "Upload documents first to start chat" : "Ask a question about your documents (e.g. Find invoice dates)..."}
                        className="flex-1 bg-[#080c18] border border-slate-800 focus:outline-none focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white"
                        disabled={sending || documents.length === 0}
                    />
                    <button
                        type="submit"
                        disabled={sending || !query.trim() || documents.length === 0}
                        className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl transition-all cursor-pointer shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </main>

            {/* Right Sidebar - RAGAS Evaluation Console */}
            <aside className="w-full lg:w-72 bg-[#0b1329]/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shrink-0 glass-panel overflow-y-auto">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">RAGAS Quality Panel</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">Observability metrics for the latest response generated. Faithfulness and Hallucination rates are checked by a citation-verifier agent.</p>
                    
                    <div className="border-b border-slate-850 my-2"></div>
                    
                    {activeEval ? (
                        <div className="space-y-4 font-mono text-[10px]">
                            
                            {/* RAGAS metrics */}
                            <div className="space-y-2.5">
                                {[
                                    { name: "Faithfulness", score: activeEval.faithfulness, desc: "Claims supported by context" },
                                    { name: "Context Precision", score: activeEval.context_precision, desc: "Retrieved chunk relevance" },
                                    { name: "Context Recall", score: activeEval.context_recall, desc: "Target answers retrieved" },
                                    { name: "Answer Relevancy", score: activeEval.answer_relevancy, desc: "Relevance of text to query" }
                                ].map((m) => (
                                    <div key={m.name} className="space-y-1 bg-slate-950/20 border border-slate-850/60 p-2.5 rounded-xl">
                                        <div className="flex justify-between font-bold text-slate-300">
                                            <span>{m.name}</span>
                                            <span className="text-white">{Math.round(m.score * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${m.score * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[8px] text-slate-500 block leading-none mt-0.5">{m.desc}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-b border-slate-850 my-2"></div>

                            {/* Token, Latency, and Cost */}
                            <div className="space-y-2 bg-[#090d16]/30 border border-slate-850 p-3 rounded-xl text-slate-400">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Latency</span>
                                    </div>
                                    <strong className="text-white">{(activeEval.latency_ms / 1000).toFixed(2)}s</strong>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Tokens Used</span>
                                    </div>
                                    <strong className="text-white">{activeEval.token_count.toLocaleString()}</strong>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Estimated Cost</span>
                                    </div>
                                    <strong className="text-emerald-450">${activeEval.estimated_cost.toFixed(5)}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500 text-[11px] font-mono border border-slate-850 rounded-xl bg-slate-950/20">
                            Ask a query to display RAGAS metrics here.
                        </div>
                    )}
                </div>
                
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-[9px] leading-relaxed text-emerald-400 font-mono mt-4 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Gemini 2.5 Flash driving vector search.</span>
                </div>
            </aside>
        </div>
    );
}
