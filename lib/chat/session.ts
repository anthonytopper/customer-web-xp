/**
 * File: services/conversations/session.ts
 *
 * Overview:
 * - Service module encapsulating business logic, side effects, or integrations. Exports: (analyze manually)
 *
 * Dependencies:
 * - ../api/conversations
 * - ../event/listener
 * - ./entrypoint
 * - ./model
 * - ./ssc
 * - @/components
 *
 * Architectural Notes:
 * - Module-level guidance should be added here based on this file's role.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
import { DisplayMessage } from "@/lib/chat/message"
import { Event, EventListener } from "@/lib/event/listener"
import { Entrypoint } from "@/lib/chat/entrypoint"
import { Conversation, ConversationType } from "@/lib/chat/model"
import { ChatRelatedContent } from "@/lib/chat/related"


export type ChatSessionState = 
    | 'preloading'   // loading entrypoints
    | 'init'         // display entrypoints
    | 'loading'      // waiting for streaming to start
    | 'streaming'    // streaming messages
    | 'ready'        // ready to send messages
    | 'error'

export type ChatSessionEvent = Event<'update'>
export type ChatSessionInputType = 'type' | 'click' | 'followon'

export interface ChatSession {
    state: ChatSessionState
    displayMessages: DisplayMessage[]
    entrypoints: Entrypoint[]
    primaryQuote: string | null
    conversation: Conversation | null
    conversationId: string;
    conversationType: ConversationType;
    conversationTitle: string;
    events: EventListener<ChatSessionEvent>
    relatedContent?: ChatRelatedContent[]
    selectEntrypoint: (entrypoint: Entrypoint) => Promise<void>
    send: (message: string, input_type: ChatSessionInputType) => Promise<void>
    init: () => Promise<void>
    stop: () => Promise<void>
    dispose?: () => void
}
