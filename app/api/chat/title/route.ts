import { NextRequest } from "next/server";
import type { SourcedChatMessageHistory } from "@/lib/api/bible";

const envString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const BASE_URL = envString(process.env.BIBLE_API_BASE);
const API_KEY = envString(process.env.BIBLE_API_KEY);

export async function POST(request: NextRequest) {
  try {
    if (!BASE_URL) {
      return new Response(
        JSON.stringify({ error: "BIBLE_API_BASE is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { message_history } = body;

    if (!message_history || !Array.isArray(message_history)) {
      return new Response(
        JSON.stringify({ error: "message_history is required and must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate message_history structure matches SourcedChatMessageHistory
    const messageHistory: SourcedChatMessageHistory[] = message_history.map((msg: unknown) => {
      if (
        typeof msg === 'object' &&
        msg !== null &&
        'role' in msg &&
        'message' in msg &&
        (msg.role === 'user' || msg.role === 'ai') &&
        typeof msg.message === 'string'
      ) {
        return {
          role: msg.role,
          message: msg.message,
        };
      }
      throw new Error('Invalid message_history structure');
    });

    // Build the Bible API URL
    const bibleApiUrl = new URL("/api/chat_title", BASE_URL).toString();

    // Create an AbortController to handle client disconnection
    const abortController = new AbortController();
    
    // Handle client disconnection
    request.signal.addEventListener("abort", () => {
      abortController.abort();
    });

    // Make the request to the Bible API
    const response = await fetch(bibleApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(API_KEY ? { "X-API-KEY": API_KEY } : {}),
      },
      body: JSON.stringify({ message_history: messageHistory }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return new Response(
        JSON.stringify({ 
          error: `Bible API request failed: ${response.status} ${response.statusText}`,
          details: errorText.slice(0, 500)
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    console.log('[ChatTitle] Request:', { message_history: messageHistory })
    console.log('[ChatTitle] Response:', data)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(null, { status: 499 }); // Client Closed Request
    }

    console.error("Error in chat title endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
