import { ChatSessionOnboard } from "@/lib/chat/onboard";
import { ChatSessionSourced } from "@/lib/chat/sourced";
import { ChatSessionSourcedInitParams } from "@/lib/chat/sourced";
import { useMemo } from "react";


export const useChatSessionSourced = (params: ChatSessionSourcedInitParams) => 
    useMemo(() => new ChatSessionSourced(params), [params]);

export const useChatSessionOnboard = () => 
    useMemo(() => new ChatSessionOnboard(), []);

