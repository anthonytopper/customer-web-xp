

export type ChatSessionMessageType = 
    | 'assistant' 
    | 'user' 
    | 'rebinder'

export interface ChatSessionMessage {
    type: ChatSessionMessageType
    name: string
    text: string
}

export type DisplayMessageBase = ChatSessionMessage

export interface DisplayMessageQuote {
    type: 'primary_quote'
    text: string
    refStr: string
    heroImg: string
}
export interface DisplayMessageReasoning {
    type: 'reasoning'
    text: string
}
export interface DisplayMessageInteractiveSelect {
    type: 'interactive_select'
    options: string[]
}
export type DisplayMessage = 
    | DisplayMessageBase 
    | DisplayMessageQuote
    | DisplayMessageReasoning
    | DisplayMessageInteractiveSelect
    