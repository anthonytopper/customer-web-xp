'use client';
import { useEventListener } from "@/hooks/useEventListener";
import { EpubBridgeIframe } from "@/lib/epub/bridge";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ChatIcon } from "../chat/ChatIcon";

interface Props {
    index: number
    chapterRefStr?: string
}
export default function Reader({ index, chapterRefStr }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [bridge, setBridge] = useState<EpubBridgeIframe | null>(null);
    const {theme} = useTheme();
    
    // Initialize bridge when iframe ref is available
    useEffect(() => {
        if (iframeRef.current) {
            const bridge = new EpubBridgeIframe(iframeRef.current, index);
            setBridge(bridge);
            setTimeout(() => {
                bridge.setHighlights([
                    {
                        id: '1',
                        cfi: 'epubcfi(/6/6!/4/2/4/6,/3:90,/23:118)',
                        color: '#f005',
                    },
                ]);
            }, 1000);
        }
    }, [index]);

    // Ensure load() is called when iframe content is ready
    // This handles cases where the iframe is already loaded when we check
    useEffect(() => {
        if (!bridge || !iframeRef.current) return;
        
        const iframe = iframeRef.current;
        
        const checkAndLoad = () => {
            try {
                const doc = iframe.contentDocument;
                // Check if contentDocument is accessible and fully loaded
                if (doc && doc.readyState === 'complete') {
                    bridge.load();
                }
            } catch (e) {
                console.error('Error loading iframe', e);
                // Cross-origin or not ready yet - will be handled by onLoad event
                // This is expected and safe to ignore here
            }
        };

        // Check immediately in case iframe is already loaded
        checkAndLoad();
        
        // Also check after a short delay to catch cases where content loads quickly
        const timeoutId = setTimeout(checkAndLoad, 100);
        
        return () => clearTimeout(timeoutId);
    }, [bridge]);

    useEffect(() => {
        if (bridge) {
            bridge.setTheme(theme === 'dark' ? 'dark' : 'light');
        }
    }, [bridge, theme]);
    
    useEventListener(bridge?.events, (event) => {
        console.log(event);
    });

    const handleLoad = () => {
        // onLoad event handler - primary mechanism for detecting when iframe loads
        if (bridge) {
            bridge.load();
        }
    };

    return (
        <>
            <ChatIcon params={{ ref: chapterRefStr ? [chapterRefStr] : undefined }} />
            <iframe 
                src={`/api/epub/spine?index=${index}`} 
                className="w-full h-full" 
                id="epub-iframe" 
                ref={iframeRef} 
                onLoad={handleLoad}
            />
        </>
    );
}