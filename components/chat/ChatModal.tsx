'use client';

import { useEffect, useState } from "react";
import ChatContainer from "./ChatContainer";
import { useEventListener } from "@/hooks/useEventListener";
import { ChatSession } from "@/lib/chat/session";

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: ChatSession;
}

export default function ChatModal({ isOpen, onClose, session }: ChatModalProps) {

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const [title, setTitle] = useState(session.conversationTitle);
    useEventListener(session.events, (event) => {   
        if (event.name === 'update') {
            setTitle(session.conversationTitle);
        }
    });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-end"
            onClick={(e) => {
                // Close if clicking the backdrop
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Backdrop */}
            {/* <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" /> */}
            
            {/* Modal Container */}
            <div className="relative w-2/5 h-[calc(100vh-5rem)] m-10 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
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
                </div>

                {/* Chat Container */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ChatContainer session={session} />
                </div>
            </div>
        </div>
    );
}
