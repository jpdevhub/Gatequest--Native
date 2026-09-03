/**
 * appEvents — native replacement for the PWA's `window.dispatchEvent(new Event(...))`
 * cross-component signalling. Same event names so the port reads 1:1.
 */
export type AppEventName = 'STATS_UPDATED' | 'REVISION_UPDATED' | 'BOOKMARKS_UPDATED';

type Listener = () => void;

const listeners: Record<AppEventName, Set<Listener>> = {
    STATS_UPDATED: new Set(),
    REVISION_UPDATED: new Set(),
    BOOKMARKS_UPDATED: new Set(),
};

export function emitAppEvent(name: AppEventName): void {
    listeners[name].forEach((listener) => {
        try {
            listener();
        } catch (err) {
            console.warn(`[appEvents] listener for ${name} threw`, err);
        }
    });
}

export function onAppEvent(name: AppEventName, listener: Listener): () => void {
    listeners[name].add(listener);
    return () => {
        listeners[name].delete(listener);
    };
}
