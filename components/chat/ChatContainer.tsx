'use client';

import { useEventListener } from "@/hooks/useEventListener";
import { DisplayMessage } from "@/lib/chat/message";
import { ChatSession } from "@/lib/chat/session";
import { ChatSessionSourced } from "@/lib/chat/sourced";
import * as BibleAPI from "@/lib/api/bible";
import { useEffect, useState } from "react";
import ChatBody from "./ChatBody";
import ChatFooter from "./ChatFooter";

interface ChatContainerProps {
    session: ChatSession;
    showTools?: boolean;
}
export default function ChatContainer({ session, showTools = true }: ChatContainerProps) {
    useEffect(() => {
        session.init();
        return () => {
            session.dispose?.();
        };
    }, [session]);
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
    useEventListener(session.events, (event) => {
        if (event.name === 'update') {
            setDisplayMessages([...session.displayMessages]);
        }
    });

    const handleToolSelect = (tool: BibleAPI.ChatTool | null) => {
        if (session instanceof ChatSessionSourced) {
            const rules = tool?.rules ?? [];
            session.setSpecialRules(rules);
        }
    };

    return (
        <div className="flex flex-col h-full container mx-auto">
            <div className="flex-1 overflow-y-auto p-4">
                <ChatBody displayMessages={displayMessages} />
            </div>
            <ChatFooter 
                onSend={(message) => session.send(message, 'type')} 
                onToolSelect={showTools ? handleToolSelect : undefined}
            />
        </div>
    );
};