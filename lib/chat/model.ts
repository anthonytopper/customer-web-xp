
export type ConversationType = 
    | 'sourced'

export type ConversationContextType = 
    | 'global'
    | 'section'
    | 'highlight'

export interface Conversation {
    id: string;
    created_at: string;
    updated_at: string;

    conversation_type: ConversationType;
    context_type: ConversationContextType;
    user_id: string;
    title?: string;
    book_id: string;
    book_version: string;
    bible_ref?: string;
    // bible_refcode_start?: number;
    // bible_refcode_end?: number;
    cfi?: string;
    starting_tool?: string;
}

