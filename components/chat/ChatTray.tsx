'use client';

import { useState } from "react";
import ChatContainer from "./ChatContainer";
import { ChatSession } from "@/lib/chat/session";
import { useEventListener } from "@/hooks/useEventListener";

interface ChatTrayProps {
    session: ChatSession;
    onClose?: () => void;
}

export default function ChatTray({ session, onClose }: ChatTrayProps) {
    const [title, setTitle] = useState(session.conversationTitle);
    useEventListener(session.events, (event) => {   
        if (event.name === 'update') {
            setTitle(session.conversationTitle);
        }
    });

    return (
        <div className="h-full w-1/2 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-xl flex-shrink-0">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        aria-label="Close chat"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Chat Container */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <ChatContainer session={session} showTools={false} />
            </div>
        </div>
    );
}
