import { DisplayMessage } from "@/lib/chat/message";
import * as BibleAPI from "@/lib/api/bible";
import * as UserAPI from "@/lib/api/user";
import { EventListener } from "@/lib/event/listener";
import { Entrypoint } from "@/lib/chat/entrypoint";
import { Conversation, ConversationType } from "@/lib/chat/model";
import { ChatRelatedContent } from "@/lib/chat/related";
import { ChatSession, ChatSessionEvent, ChatSessionInputType, ChatSessionState } from "./session";


export interface BaseSourcedChatElement {
    attributed_to: string;
    content: string;
}

export interface ExpertQuoteElement extends BaseSourcedChatElement {
    element_type: "expert_content_quote";
}

export interface ExpertParaphraseElement extends BaseSourcedChatElement {
    element_type: "expert_content_paraphrase";
}

export interface GuideContentElement extends BaseSourcedChatElement {
    element_type: "guide_content";
}

export interface ScriptureQuoteElement extends BaseSourcedChatElement {
    element_type: "scripture_quote";
    reference: string;
}

export type SourcedChatElement =
    | ScriptureQuoteElement
    | GuideContentElement
    | ExpertQuoteElement
    | ExpertParaphraseElement;

export type SourcedChatElementType = SourcedChatElement['element_type'];

export interface SourcedChat {
    content: SourcedChatElement[];
}




export type SourcedChatEventElementInit = Omit<SourcedChatElement, 'content'>

export interface SourcedChatEventElementAppend {
    element_idx: number;
    content: string;
}

export type SourcedChatEventMap = {
    element_init: SourcedChatEventElementInit;
    element_append: SourcedChatEventElementAppend;
    done: object
}


export interface ChatSessionSourcedInitParams {
    ref?: string[]
    entrypointOptions?: Entrypoint[]
    primaryQuote?: string
    specialRules?: string[]
    userInfo?: string[]
}

interface SourcedChatUserMessageInternal {
    element_type: 'user'
    attributed_to: string
    content: string
}

type SourcedChatMessageInternal = SourcedChatUserMessageInternal | SourcedChatElement



export class ChatSessionSourced implements ChatSession {
    private _state: ChatSessionState = 'preloading'
    private _messages: SourcedChatMessageInternal[] = []
    private _entrypoints: Entrypoint[] | null = null
    private _conversation: Conversation | null = null
    private _primaryQuote: string | null = null
    private _relatedContent?: ChatRelatedContent[]
    private _abortController: AbortController | null = null
    private _refs: string[] = []
    private _specialRules: string[] = []
    private _userInfo: string[] = []

    // Track elements being built during streaming
    private _elements: Map<number, {
        element_type: SourcedChatEventElementInit['element_type']
        attributed_to: string
        content: string
        ref?: string
    }> = new Map()

    events = new EventListener<ChatSessionEvent>()

    constructor(params: ChatSessionSourcedInitParams = {}) {
        this._refs = params.ref ?? []
        this._entrypoints = params.entrypointOptions ?? null
        this._primaryQuote = params.primaryQuote ?? null
        this._specialRules = params.specialRules ?? []
        this._userInfo = params.userInfo ?? []
    }

    setSpecialRules(rules: string[]): void {
        this._specialRules = rules
    }

    get state(): ChatSessionState {
        return this._state
    }

    get displayMessages(): DisplayMessage[] {
        return this._messages.map(message => this._convertMessageToDisplayMessage(message))
    }

    get entrypoints(): Entrypoint[] {
        return this._entrypoints ?? []
    }

    get primaryQuote(): string | null {
        return this._primaryQuote
    }

    get conversation(): Conversation | null {
        return this._conversation
    }

    get conversationId(): string {
        return this._conversation?.id ?? ''
    }

    get conversationType(): ConversationType {
        return 'sourced'
    }

    get conversationTitle(): string {
        return this._conversation?.title ?? 'New Conversation'
    }

    get relatedContent(): ChatRelatedContent[] | undefined {
        return this._relatedContent
    }

    private _sync() {
        this.events.publish({
            name: 'update'
        })
    }

    private _setState(state: ChatSessionState) {
        this._state = state
        this._sync()
    }

    private _convertMessageToDisplayMessage(message: SourcedChatMessageInternal): DisplayMessage {
        if (message.element_type === 'user') {
            return {
                type: 'user',
                text: message.content,
                name: message.attributed_to
            }
        }
        if (message.element_type === 'expert_content_paraphrase' || message.element_type === 'expert_content_quote') {
            return {
                type: 'rebinder',
                name: message.attributed_to,
                text: message.content
            }
        }
        if (message.element_type === 'scripture_quote') {
            return {
                type: 'primary_quote',
                text: message.content,
                refStr: message.reference ?? '',
                heroImg: ''
            }
        }
        return {
            type: 'assistant',
            text: message.content,
            name: message.attributed_to
        }
    }

    private _getTurnsHistory(): BibleAPI.SourcedChatMessageHistory[] {
        const messages: BibleAPI.SourcedChatMessageHistory[] = [];
        let currentAIMessages: SourcedChatElement[] = [];
        let currentUserMessages: string[] = [];

        for (const message of this._messages) {
            if (message.element_type === 'user') {
                // If we have accumulated AI messages, add them as a single AI turn
                if (currentAIMessages.length > 0) {
                    messages.push({
                        role: 'ai',
                        message: JSON.stringify({ content: currentAIMessages })
                    });
                    currentAIMessages = [];
                }
                // Accumulate adjacent user messages
                currentUserMessages.push(message.content);
            } else {
                // If we have accumulated user messages, add them as a single user turn
                if (currentUserMessages.length > 0) {
                    messages.push({
                        role: 'user',
                        message: currentUserMessages.join('\n'),
                    });
                    currentUserMessages = [];
                }

                
                // Accumulate adjacent AI messages (SourcedChatElement)
                currentAIMessages.push(message);
            }
        }
        
        // Don't forget to add any remaining user messages at the end
        if (currentUserMessages.length > 0) {
            messages.push({
                role: 'user',
                message: currentUserMessages.join('\n'),
            });
        }
        
        // Don't forget to add any remaining AI messages at the end
        if (currentAIMessages.length > 0) {
            messages.push({
                role: 'ai',
                message: JSON.stringify({ content: currentAIMessages })
            });
        }

        return messages;
    }

    async selectEntrypoint(entrypoint: Entrypoint): Promise<void> {
        await this.send(entrypoint.prompt, 'click')
    }

    async send(message: string, _: ChatSessionInputType): Promise<void> {
        const messageHistory = this._getTurnsHistory()
        this._messages.push({
            element_type: 'user',
            attributed_to: 'Me',
            content: message,
        })

        const preStreamLength = this._messages.length
        this._setState('loading')
        
        // Create new abort controller for this request
        this._abortController = new AbortController()
        
        // Clear elements map for new stream
        this._elements.clear()

        console.debug('[ChatSessionSourced] Sending message', message)

        try {
            const { eventSource } = await BibleAPI.sourcedChatStream({
                ref: this._refs,
                user_input: message,
                highlight_text: this._primaryQuote ?? undefined,
                message_history: messageHistory,
                special_rules: this._specialRules,
                user_info: this._userInfo,
            })

            // Handle abort signal
            if (this._abortController.signal.aborted) {
                eventSource.close()
                return
            }
            this._abortController.signal.addEventListener('abort', () => {
                eventSource.close()
            }, { once: true })

            // Listen for 'init' events
            eventSource.addEventListener('element_init', (event) => {
                console.log('[ChatSessionSourced] Init event', event)
                try {
                    if (!event.data) return
                    const data: SourcedChatEventElementInit = JSON.parse(event.data)
                    const element = {...data, content: ''} as SourcedChatElement
                    if (element.element_type === 'scripture_quote') {
                        // TODO: SSE provides `ref` but model uses `reference`
                        element.reference = (data as unknown as { ref: string }).ref
                    }
                    this._messages.push(element)
                    this._setState('streaming')
                } catch (error) {
                    console.error('[ChatSessionSourced] Error parsing init event', error)
                }
            })

            eventSource.addEventListener('open', (event) => {
                console.log('[ChatSessionSourced] Open event', event)
            })

            // Listen for 'append' events
            eventSource.addEventListener('element_append', (event) => {
                try {
                    if (!event.data) return
                    const data: SourcedChatEventElementAppend = JSON.parse(event.data)
                    const message = this._messages[this._messages.length - 1]
                    message.content += data.content
                    this._sync()
                } catch (error) {
                    console.error('[ChatSessionSourced] Error parsing append event', error)
                }
            })

            // Listen for 'done' event
            eventSource.addEventListener('done', async () => {
                console.log('[ChatSessionSourced] Done event')
                this._abortController = null
                this._setState('ready')

                const {title} = await BibleAPI.getChatTitle(this._getTurnsHistory())

                const conversation = await UserAPI.createConversation({
                    conversation_type: 'raia_1r',
                    context_type: 'raia_1r',
                    starting_tool: 'raia_1r',
                    title,
                    book_id: '1',
                    book_version: '1',
                })

                if (conversation) {
                    this._conversation = conversation
                    this._sync()
                }

                const newMessages = this._messages.slice(preStreamLength)
                for (const message of newMessages) {
                    const request: UserAPI.ConversationMessageCreateRequest = {
                        type: message.element_type,
                        content: message.content,
                        attribution: message.attributed_to,
                    }
                    if (message.element_type === 'scripture_quote') {
                        request.bible_ref = message.reference
                        console.log('[ChatSessionSourced] Adding scripture quote to conversation', request)
                    }
                    await UserAPI.addMessageToConversation(this._conversation?.id ?? '', request)
                }

                await UserAPI.addMessageToConversation(this._conversation?.id ?? '', {
                    type: 'user',
                    content: message,
                    attribution: 'Me',
                })

                
            })

            // Listen for 'error' events
            eventSource.addEventListener('error', (event) => {
                this._abortController = null
                console.error('[ChatSessionSourced] Stream error', event)
                this._setState('error')
            })

            // Listen for 'close' event
            eventSource.addEventListener('close', () => {
                this._abortController = null
                // Ensure we're in ready state if stream closes normally
                if (this._state === 'streaming' || this._state === 'loading') {
                    this._setState('ready')
                }
            })

            eventSource.open()

        } catch (error) {
            this._abortController = null
            console.error('[ChatSessionSourced] Error sending message', error)
            this._setState('error')
        }

    }

    async init(): Promise<void> {
        this._setState('preloading')
        
        // If entrypoints are provided, show them
        if (this._entrypoints && this._entrypoints.length > 0) {
            this._setState('init')
            return
        }
        
        // Otherwise, ready to start
        this._setState('ready')
    }

    async stop() {
        if (this._abortController) {
            this._abortController.abort()
            this._abortController = null
            this._setState('ready')
        }
    }

    dispose(): void {
        if (this._abortController) {
            this._abortController.abort()
            this._abortController = null
        }
    }
}
