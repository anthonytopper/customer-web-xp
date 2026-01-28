interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
}
export default function ChatInput({ value, onChange, onSend }: ChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="flex flex-row items-stretch gap-2 px-[18px] py-[14px] bg-[#EDEFF0] rounded-[24px] flex-1 min-w-0">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder="What does the holy spirit have to do with wisdom for protestants?"
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-base leading-[1.5em] text-black placeholder:text-black placeholder:opacity-60"
                style={{
                    fontFamily: 'Euclid Circular A, Inter, Helvetica, sans-serif',
                    fontWeight: 400,
                }}
            />
        </div>
    );
}