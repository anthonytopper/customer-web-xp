/**
 * File: services/event/priority.ts
 *
 * Overview:
 * - Service module encapsulating business logic, side effects, or integrations. Exports: EventListenerWithPriority
 *
 * Dependencies:
 * - ../epub/injected/log
 * - ./listener
 *
 * Architectural Notes:
 * - Module-level guidance should be added here based on this file's role.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
import { log } from "../epub/injected/log";
import { Event } from "./listener";

export type EventCallbackWithPriority<E extends Event> = (event:E) => boolean;
 
interface ListenerRecord<E extends Event> {
    callback: EventCallbackWithPriority<E>;
    priority: number;
}
export class EventListenerWithPriority<E extends Event> {
    protected _listeners : ListenerRecord<E>[] = [];

    protected _sortListeners() {
        this._listeners.sort((a, b) => b.priority - a.priority);
    }

    publish(event:E) {
        // let foundPriority : number | null = null;
        log('click [EventListenerWithPriority] publish', event, this._listeners)
        for (const {callback, priority} of this._listeners) {
            // if (typeof foundPriority === 'number') {
            //     if (priority === foundPriority) {
            //         callback(event);
            //     } else {
            //         break;
            //     }
            // }
            if (callback(event)) {
                // foundPriority = priority;
                log('click [EventListenerWithPriority] publish', event, priority, callback)
                return;
            }
        }
    }

    subscribe(priority: number, callback:EventCallbackWithPriority<E>) {
        this._listeners.push({callback, priority});
        this._sortListeners();
    }

    unsubscribe(callback:EventCallbackWithPriority<E>) {
        this._listeners = this._listeners.filter(listener => listener.callback !== callback);
    }
}
