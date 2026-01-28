import { DisplayMessage } from "@/lib/chat/message";
import Markdown from "react-markdown";

interface ChatMessageProps {
    message: DisplayMessage;
}
export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.type === 'user';
    const isRebinder = 'type' in message && message.type === 'rebinder';
    const isReasoning = message.type === 'reasoning';
    const isInteractiveSelect = message.type === 'interactive_select';
    const isBubble = isRebinder || isUser;
    const name = 'name' in message ? message.name : message.type === 'primary_quote' ? 'Bible (ASV)' : 'Assistant';

    if (isInteractiveSelect) {
        return (
            <ul className="flex flex-col items-end gap-[11px] self-end">
                {message.options.map((option) => (
                    <li key={option}>
                        <button
                            type="button"
                            className="w-full rounded-[30px] border border-[#BFBFC1] bg-white px-[14px] py-[10px] text-left text-[14px] font-normal leading-[1.268] text-[#3C3D47] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] hover:bg-gray-100 cursor-pointer"
                        >
                            {option}
                        </button>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className={`max-w-4/5 p-4 ${isRebinder ? 'bg-chat-rebinder-bg' : ''} ${isBubble ? 'rounded-xl' : ''} ${isUser ? 'self-end bg-chat-user-bg' : 'self-start'}`}>
            {!isReasoning && <div className={`font-bold ${isRebinder ? 'text-chat-rebinder-fg' : ''} ${isUser ? 'text-chat-user-fg' : ''}`}>{name}</div>}
            <div className={isReasoning ? "text-gray-500 italic" : undefined}>
                <Markdown>{message.text}</Markdown>
            </div>
            {message.type === 'primary_quote' && <div className="text-sm text-gray-500 mt-4">{message.refStr}</div>}
        </div>
    );
}