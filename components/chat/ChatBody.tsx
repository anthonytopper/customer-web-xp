import { DisplayMessage } from "@/lib/chat/message";
import ChatMessage from "./ChatMessage";


interface ChatBodyProps {
    displayMessages: DisplayMessage[];
}
export default function ChatBody({ displayMessages }: ChatBodyProps) {
    return (
        <div className="flex flex-col gap-2">
            {displayMessages.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
        </div>
    );
}