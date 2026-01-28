import { DisplayMessage } from "@/lib/chat/message";
import { EventListener } from "@/lib/event/listener";
import { Entrypoint } from "@/lib/chat/entrypoint";
import { Conversation, ConversationType } from "@/lib/chat/model";
import { ChatRelatedContent } from "@/lib/chat/related";
import { ChatSession, ChatSessionEvent, ChatSessionInputType, ChatSessionState } from "@/lib/chat/session";

interface OnboardPromptResponse {
    prompt: string;
    options: string[];
}

export class ChatSessionOnboard implements ChatSession {
    private _state: ChatSessionState = 'preloading';
    private _messages: DisplayMessage[] = [];
    private _conversation: Conversation | null = null;
    private _abortController: AbortController | null = null;

    events = new EventListener<ChatSessionEvent>();

    get state(): ChatSessionState {
        return this._state;
    }

    get displayMessages(): DisplayMessage[] {
        return this._messages;
    }

    get entrypoints(): Entrypoint[] {
        return [];
    }

    get primaryQuote(): string | null {
        return null;
    }

    get conversation(): Conversation | null {
        return this._conversation;
    }

    get conversationId(): string {
        return this._conversation?.id ?? '';
    }

    get conversationType(): ConversationType {
        return 'sourced';
    }

    get conversationTitle(): string {
        return this._conversation?.title ?? 'Onboarding';
    }

    get relatedContent(): ChatRelatedContent[] | undefined {
        return undefined;
    }

    private _sync() {
        this.events.publish({ name: 'update' });
    }

    private _setState(state: ChatSessionState) {
        this._state = state;
        this._sync();
    }

    private async _sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
        if (signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }
        await new Promise<void>((resolve, reject) => {
            const onAbort = () => {
                window.clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
            };
            const timer = window.setTimeout(() => {
                signal.removeEventListener('abort', onAbort);
                resolve();
            }, ms);
            signal.addEventListener('abort', onAbort, { once: true });
        });
    }

    async init(): Promise<void> {
        this._setState('preloading');
        this._abortController?.abort();
        this._abortController = new AbortController();

        try {
            const response = await fetch('/api/chat/onboard', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: this._abortController.signal,
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`Onboard chat request failed: ${response.status} ${response.statusText}${errorText ? ` — ${errorText.slice(0, 300)}` : ''}`);
            }

            const data = await response.json() as OnboardPromptResponse;

            this._messages = [
                {
                    type: 'reasoning',
                    text: 'Scanning 2000+ commentary sources',
                },
            ];
            this._setState('ready');

            await this._sleepWithAbort(700, this._abortController.signal);

            this._messages = [
                {
                    type: 'assistant',
                    name: 'Assistant',
                    text: data.prompt,
                },
                {
                    type: 'interactive_select',
                    options: data.options ?? [],
                },
            ];

            this._setState('ready');
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            console.error('[ChatSessionOnboard] init error', error);
            this._setState('error');
        }
    }

    async selectEntrypoint(entrypoint: Entrypoint): Promise<void> {
        await this.send(entrypoint.prompt, 'click');
    }

    async send(message: string, inputType: ChatSessionInputType): Promise<void> {
        void inputType;
        this._messages.push({
            type: 'user',
            name: 'Me',
            text: message,
        });
        this._sync();
    }

    async stop(): Promise<void> {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
            this._setState('ready');
        }
    }

    dispose(): void {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    }
}
