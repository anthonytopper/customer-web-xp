import { useState } from "react";
import ChatInput from "./ChatInput";
import { ChatToolList } from "./ChatToolList";
import * as BibleAPI from "@/lib/api/bible";

interface ChatFooterProps {
    onSend: (message: string) => void;
    onToolSelect?: (tool: BibleAPI.ChatTool | null) => void;
}
export default function ChatFooter({ onSend, onToolSelect }: ChatFooterProps) {
    const [value, setValue] = useState('');
    
    const handleSend = () => {
        if (value.trim()) {
            onSend(value);
            setValue('');
        }
    };

    return (
        <div className="flex flex-row justify-center items-end gap-2 p-3 bg-white w-full">
            {onToolSelect && <ChatToolList onToolSelect={onToolSelect} />}
            <ChatInput
                value={value}
                onChange={(value) => setValue(value)}
                onSend={handleSend}
            />
            <button
                onClick={handleSend}
                className="flex items-center justify-center w-[52px] h-[52px] py-1 px-0 shrink-0 text-white bg-[#3C3D47] rounded-full"
                aria-label="Send message"
            >
                <svg width="18" height="18" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.20103 2.03882L1.81342 13.9601L6.42499 12.4295V7.71118C6.42499 7.29696 6.76078 6.96118 7.17499 6.96118C7.58921 6.96118 7.92499 7.29696 7.92499 7.71118V12.4116L12.5412 13.957L7.20103 2.03882ZM6.7055 0.115731C7.02 -0.0391381 7.38872 -0.0385459 7.70272 0.117332C7.97921 0.254588 8.12391 0.494938 8.1937 0.619409C8.26885 0.753427 8.34577 0.92518 8.42246 1.09642C8.42617 1.10471 8.42988 1.113 8.43359 1.12128L14.0612 13.681C14.1398 13.8564 14.2182 14.0312 14.269 14.1786C14.3156 14.3138 14.4008 14.5863 14.3163 14.8877C14.2209 15.2282 13.971 15.504 13.6415 15.6324C13.3498 15.746 13.0703 15.6879 12.9311 15.6547C12.7794 15.6186 12.5977 15.5578 12.4154 15.4967L7.20294 13.7517L1.93498 15.5002C1.75238 15.5609 1.57043 15.6213 1.41855 15.657C1.27927 15.6898 0.999395 15.7472 0.707937 15.6328C0.378715 15.5035 0.129475 15.2269 0.035043 14.886C-0.0485572 14.5842 0.037618 14.3118 0.0846731 14.1767C0.13598 14.0294 0.214957 13.8547 0.294216 13.6794L5.97141 1.11733C5.97514 1.10907 5.97888 1.1008 5.98261 1.09253C6.05986 0.921527 6.13733 0.750011 6.21291 0.616228C6.2831 0.491983 6.42857 0.252098 6.7055 0.115731Z" fill="currentColor"/>
                </svg>
            </button>
        </div>
    );
}
