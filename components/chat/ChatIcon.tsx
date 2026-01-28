'use client';
import { RaiaIcon } from "../icons/RaiaIcon";

interface ChatIconProps {
    onClick: () => void;
}
export const ChatIcon = ({ onClick }: ChatIconProps) => {
    return (
        <>
            <button
                onClick={onClick}
                className="fixed bottom-8 right-24 w-14 h-14  rounded-full shadow-lg  transition-opacity flex items-center justify-center z-40 cursor-pointer hover:opacity-70"
                aria-label="Open chat"
            >
                <RaiaIcon size={64} />
            </button>
        </>
    );
};