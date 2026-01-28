'use client';

import ChatContainer from "@/components/chat/ChatContainer";
import { ChatSessionSourced } from "@/lib/chat/sourced";
import { useMemo } from "react";


export default function ChatPage() {
    const session = useMemo(() => new ChatSessionSourced(), []);
    return (
        <div className="flex flex-col h-content pt-[64px] bg-white">
            <ChatContainer session={session} />
        </div>
    );
}