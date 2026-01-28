import { SessionData } from "@auth0/nextjs-auth0/types";
import { apiClient, RequestOptions } from "./client";
import { User } from "@/lib/models/user";
import { Conversation } from "@/lib/chat/model";

const envString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim().length > 0 ? value : undefined;

const normalizeBaseUrl = (baseUrl: string | undefined): string | undefined => {
    if (!baseUrl) return undefined;
    const trimmed = baseUrl.trim();
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

// Next.js server-side environment variables (not exposed to client).
// Required:
// - USER_API_BASE=https://...
// - USER_API_KEY=...
// These are server-only and will not be exposed to the browser.
const BASE_URL = normalizeBaseUrl(envString(process.env.USER_API_BASE ?? process.env.NEXT_PUBLIC_USER_API_BASE));
const API_KEY = envString(process.env.USER_API_KEY);

export const getOptions = (opts?: { authToken?: string; signal?: AbortSignal }): RequestOptions => ({
    baseUrl: BASE_URL,
    authToken: opts?.authToken ?? "",
    headers: API_KEY ? { "X-API-KEY": API_KEY } : {},
    signal: opts?.signal,
});


export const getMe = async (session: SessionData) => {
    // Use idToken (always a JWT) instead of accessToken (may be opaque)
    // If you need a JWT access token specifically, configure Auth0 API to issue JWT tokens
    const token = session.tokenSet.idToken;

    if (!token) {
        throw new Error("No token available in session");
    }
    return apiClient.get<User>("/user/me", getOptions({ authToken: token }));
};

export type UpdateMeRequest = Partial<Pick<User, "name" | "email" | "stripe_customer_id">>;

export const updateMe = async (session: SessionData, request: UpdateMeRequest) => {
    // Use idToken (always a JWT) instead of accessToken (may be opaque)
    // If you need a JWT access token specifically, configure Auth0 API to issue JWT tokens
    const token = session.tokenSet.idToken;
    if (!token) {
        throw new Error("No token available in session");
    }
    return apiClient.patch<User>("/user/me", request, getOptions({ authToken: token }));
};


export interface ConversationCreateRequest {
    conversation_type: string;
    context_type: string;
    starting_tool?: string | null;
    title?: string | null;
    book_id: string;
    book_version: string;
    bible_ref?: string | null;
    cfi?: string | null;
}

export type ConversationResponse = Conversation;

export interface ConversationMessageCreateRequest {
    type: string;
    content: string;
    attribution?: string | null;
    bible_ref?: string | null;
    cfi?: string | null;
}

export interface ConversationMessageResponse {
    id: string;
    sequence_number: number;
    conversation_id: string;
    created_at: string;
    attribution?: string | null;
    type: string;
    content: string;
    bible_ref?: string | null;
    cfi?: string | null;
}

/**
 * List conversations for the authenticated user
 * GET /conversations
 */
export async function listConversations(
    params?: {
        limit?: number;
        offset?: number;
        authToken?: string;
        signal?: AbortSignal;
    }
) {
    const { limit = 50, offset = 0, authToken, signal } = params || {};
    const queryParams = new URLSearchParams();
    if (limit !== undefined) queryParams.append("limit", limit.toString());
    if (offset !== undefined) queryParams.append("offset", offset.toString());

    const endpoint = `conversations${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return apiClient.get<ConversationResponse[]>(endpoint, getOptions({ authToken, signal }));
}

/**
 * Create a new conversation
 * POST /conversations
 */
export async function createConversation(
    request: ConversationCreateRequest,
    opts?: {
        authToken?: string;
        signal?: AbortSignal;
    }
) {
    return apiClient.post<ConversationResponse>(
        "conversations",
        request,
        getOptions(opts)
    );
}

/**
 * Get conversation messages/history
 * GET /conversations/{conversation_id}/messages
 */
export async function getConversationMessages(
    conversationId: string,
    params?: {
        limit?: number | null;
        offset?: number;
        authToken?: string;
        signal?: AbortSignal;
    }
) {
    const { limit, offset = 0, authToken, signal } = params || {};
    const queryParams = new URLSearchParams();
    if (limit !== undefined && limit !== null) queryParams.append("limit", limit.toString());
    if (offset !== undefined) queryParams.append("offset", offset.toString());

    const endpoint = `conversations/${encodeURIComponent(conversationId)}/messages${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return apiClient.get<ConversationMessageResponse[]>(endpoint, getOptions({ authToken, signal }));
}

/**
 * Add a message to a conversation
 * POST /conversations/{conversation_id}/messages
 */
export async function addMessageToConversation(
    conversationId: string,
    request: ConversationMessageCreateRequest,
    opts?: {
        authToken?: string;
        signal?: AbortSignal;
    }
) {
    console.log('[UserAPI2] Adding message to conversation', conversationId, request);
    const response = await apiClient.post<ConversationMessageResponse>(
        `conversations/${encodeURIComponent(conversationId)}/messages`,
        request,
        getOptions(opts)
    );
    console.log('[UserAPI2] Added message to conversation', response);
    return response;
}