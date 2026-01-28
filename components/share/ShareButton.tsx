"use client";
import { SharedResponse } from "@/lib/api/shared";
import { FaShare } from "react-icons/fa";

interface ShareButtonProps {
  shared: SharedResponse;
  refStr: string;
  verseText: string;
}
export const ShareButton = ({ shared, refStr, verseText }: ShareButtonProps) => {

  return (
    <div
        className="flex h-12 items-center justify-center gap-4 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium"
        onClick={() => {
            navigator.share({
                title: refStr + " - Rebind",
                text: verseText,
                url: window.location.href,
            });
        }}
    >
        Re-share <FaShare />
    </div>
  );
};