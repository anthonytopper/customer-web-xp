import { NextRequest } from "next/server";
import type { SourcedChatStreamingParams } from "@/lib/api/bible";

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

    const payload: SourcedChatStreamingParams = await request.json();

    // Build the Bible API URL
    const bibleApiUrl = new URL("/api/sourced_chat_sse?llm_patch=gpt-5.1", BASE_URL).toString();

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
        "Accept": "text/event-stream",
        ...(API_KEY ? { "X-API-KEY": API_KEY } : {}),
      },
      body: JSON.stringify(payload),
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

    // Check if response body exists
    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "No response body from Bible API" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the response back to the client as SSE
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(null, { status: 499 }); // Client Closed Request
    }
    
    console.error("Error in sourced chat endpoint:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
