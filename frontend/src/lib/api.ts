const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
    token?: string;
}

export interface User {
    id?: string;
    email?: string;
    full_name?: string;
    role?: string;
    tenant_id?: string;
    [key: string]: unknown;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface DashboardStats {
    total_reports: number;
    total_tokens: number;
    total_cost: number;
    blocked_security_events: number;
    monthly_breakdown: Array<{ name: string; reports: number; cost: number; tokens: number }>;
    recent_events?: Array<{
        status: string;
        action: string;
        created_at: string;
        details: string;
        user_email: string;
        ip_address?: string;
    }>;
    average_faithfulness: number;
    average_answer_relevancy: number;
    average_confidence: number;
    average_latency_ms: number;
}

export interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    tenant_id?: string;
    created_at: string;
}

export interface ReportSummary {
    id: string;
    title: string;
    topic: string;
    status: string;
    evaluation?: {
        faithfulness?: number;
        answer_relevancy?: number;
        confidence_score?: number;
        hallucination_rate?: number;
        latency_ms?: number;
        estimated_cost: number;
        token_count: number;
    };
    created_at: string;
}

export interface ReportDetail extends ReportSummary {
    content: string;
    pdf_url: string;
    docx_url: string;
    sources?: Array<{
        title: string;
        credibility_score: number;
        content: string;
        url?: string;
    }>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, headers = {}, ...rest } = options;
    const requestHeaders: Record<string, string> = {
        ...(headers as Record<string, string>),
    };

    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (authToken) {
        requestHeaders["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: requestHeaders,
        ...rest,
    });

    if (response.status === 204) {
        return null as unknown as T;
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "An unexpected error occurred");
    }

    return data as T;
}

export const api = {
    register: (body: { email: string; full_name: string; password: string }) =>
        request<AuthResponse>("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, role: "editor" }),
        }),

    login: (formData: URLSearchParams) =>
        request<AuthResponse>("/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
        }),

    getMe: () => request<User>("/auth/me"),

    listDocuments: () => request<any[]>("/documents"),

    getDocument: (id: string) => request<any>(`/documents/${id}`),

    deleteDocument: (id: string) =>
        request<void>(`/documents/${id}`, {
            method: "DELETE",
        }),

    uploadDocument: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return request<{ message?: string, document_id?: string }>("/upload", {
            method: "POST",
            body: formData,
        });
    },

    uploadDocumentVersion: (id: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return request<any>(`/documents/${id}/version`, {
            method: "POST",
            body: formData,
        });
    },

    updateDocumentExpiry: (id: string, expiryDays: number) =>
        request<any>(`/documents/${id}/expiry`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiry_days: expiryDays }),
        }),

    queryChat: (query: string) =>
        request<any>("/chat/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        }),

    getDashboardStats: () => request<any>("/analytics/dashboard"),

    listAdminUsers: () => request<AdminUser[]>("/admin/users"),

    updateUserRole: (userId: string, role: string) =>
        request<AdminUser>(`/admin/users/${userId}/role`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
        }),
};
