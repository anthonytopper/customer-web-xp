import type { RequestOptions } from "./client";

/**
 * Custom EventSource-like implementation that supports POST requests for SSE.
 * Standard EventSource only supports GET, so we need a custom implementation.
 */
export class PostEventSource {
    private eventListeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();
    private readyState: number = 0; // CONNECTING = 0, OPEN = 1, CLOSED = 2
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private decoder: TextDecoder = new TextDecoder();
    private buffer: string = '';
    private abortController: AbortController;

    constructor(
        private url: string,
        private payload: unknown,
        private options: RequestOptions
    ) {
        this.abortController = new AbortController();
        if (options.signal) {
            if (options.signal.aborted) {
                this.abortController.abort();
            } else {
                options.signal.addEventListener('abort', () => {
                    this.abortController.abort();
                }, { once: true });
            }
        }
    }

    addEventListener(event: string, listener: (event: MessageEvent) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(listener);
    }

    removeEventListener(event: string, listener: (event: MessageEvent) => void): void {
        this.eventListeners.get(event)?.delete(listener);
    }

    private dispatchEvent(event: string, data: string): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const messageEvent = new MessageEvent(event, { data });
            listeners.forEach(listener => {
                try {
                    listener(messageEvent);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    async open(): Promise<void> {
        if (this.readyState !== 0) return; // Already opened or closed

        try {
            const fullUrl = this.buildUrl();
            const headers = this.buildHeaders();

            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify(this.payload),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`SSE request failed: ${response.status} ${response.statusText}${text ? ` — ${text.slice(0, 300)}` : ''}`);
            }

            this.readyState = 1; // OPEN
            this.dispatchEvent('open', '');

            const reader = response.body?.getReader();
            if (!reader) {
                this.close();
                return;
            }

            this.reader = reader;
            this.processStream();
        } catch (error) {
            if ((error as { name?: string }).name === 'AbortError') {
                this.close();
            } else {
                this.readyState = 2; // CLOSED
                this.dispatchEvent('error', error instanceof Error ? error.message : String(error));
            }
        }
    }

    private async processStream(): Promise<void> {
        if (!this.reader) return;

        try {
            while (true) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    // Flush any remaining data in buffer
                    const flush = this.decoder.decode();
                    if (flush) {
                        this.buffer += flush;
                    }
                    // Parse any remaining SSE data
                    if (this.buffer.trim()) {
                        this.parseSSE(true);
                    }
                    this.close();
                    break;
                }

                if (value) {
                    this.buffer += this.decoder.decode(value, { stream: true });
                    this.parseSSE();
                }
            }
        } catch (error) {
            if ((error as { name?: string }).name !== 'AbortError') {
                this.dispatchEvent('error', error instanceof Error ? error.message : String(error));
            }
            this.close();
        }
    }

    private parseSSE(isFinal = false): void {
        const lines = this.buffer.split('\n');
        // Keep the last incomplete line in buffer (unless this is the final parse)
        this.buffer = isFinal ? '' : (lines.pop() || '');

        let eventType = 'message';
        let data = '';

        for (const line of lines) {
            if (line.trim() === '') {
                // Empty line indicates end of event
                if (data) {
                    this.dispatchEvent(eventType, data);
                    eventType = 'message';
                    data = '';
                }
                continue;
            }

            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                // No colon, treat entire line as data
                data += (data ? '\n' : '') + line;
                continue;
            }

            const field = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();

            if (field === 'event') {
                eventType = value;
            } else if (field === 'data') {
                data += (data ? '\n' : '') + value;
            }
            // Ignore other fields like 'id', 'retry', etc.
        }

        // If this is the final parse and we have remaining data, dispatch it
        if (isFinal && data) {
            this.dispatchEvent(eventType, data);
        }
    }

    close(): void {
        if (this.readyState === 2) return; // Already closed

        this.readyState = 2; // CLOSED
        this.abortController.abort();
        this.reader?.cancel().catch(() => {});
        this.reader = null;
        this.dispatchEvent('close', '');
    }

    private buildUrl(): string {
        const baseUrl = this.options.baseUrl;
        if (!baseUrl) return this.url;
        if (/^[a-z][a-z0-9+.-]*:\/\//i.test(this.url)) return this.url;
        return new URL(this.url, baseUrl).toString();
    }

    private buildHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            ...(this.options.headers ?? {}),
        };
        if (this.options.authToken) {
            headers.Authorization = `Bearer ${this.options.authToken}`;
        }
        return headers;
    }

    get CONNECTING(): number { return 0; }
    get OPEN(): number { return 1; }
    get CLOSED(): number { return 2; }
}
