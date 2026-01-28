/**
 * File: hooks/useEventListener.ts
 *
 * Overview:
 * - Custom React hook encapsulating reusable stateful logic. Exports: useEventListener
 *
 * Dependencies:
 * - @/services
 * - react
 *
 * Architectural Notes:
 * - Custom React hook. Call only at top level of function components or other hooks.
 * - Ensure effects have stable dependency arrays and clean up subscriptions/timeouts.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
import { Event, EventListener } from "@/lib/event/listener";
import { useEffect } from "react";

export const useEventListener = <E extends Event>(event: EventListener<E> | null | undefined, callback: (event: E) => void, extraDeps: React.DependencyList = []) => {
    useEffect(() => {
        if (!event) return
        const handler = (event: E) => {
            callback(event)
        }
        event.subscribe(handler)
        return () => {
            event.unsubscribe(handler)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, ...extraDeps])
}

