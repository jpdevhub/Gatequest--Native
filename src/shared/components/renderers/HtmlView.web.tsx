import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { HtmlViewHandle, HtmlViewProps } from './HtmlView';

/**
 * Web implementation of HtmlView: an iframe with the same message protocol as
 * the native WebView. react-native-webview renders an error stub on web, so the
 * platform split lives here rather than inside the calling components.
 */
function HtmlViewWeb(
    { html, onHeight, onSelect, onReady }: HtmlViewProps,
    ref: React.Ref<HtmlViewHandle>
) {
    const frameRef = useRef<HTMLIFrameElement | null>(null);

    useImperativeHandle(ref, () => ({
        applyState(state) {
            frameRef.current?.contentWindow?.postMessage(
                JSON.stringify({ type: 'applyState', state }),
                '*'
            );
        },
    }));

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            // Only listen to this iframe, not every frame on the page.
            if (frameRef.current && event.source !== frameRef.current.contentWindow) return;
            try {
                const payload =
                    typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!payload || typeof payload !== 'object') return;
                if (payload.type === 'height' && payload.height > 0) onHeight?.(payload.height);
                else if (payload.type === 'select') onSelect?.(payload.index);
            } catch {
                // Not a message for us.
            }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [onHeight, onSelect]);

    return (
        <iframe
            ref={frameRef}
            srcDoc={html}
            onLoad={onReady}
            scrolling="no"
            title="question content"
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
        />
    );
}

export default forwardRef<HtmlViewHandle, HtmlViewProps>(HtmlViewWeb);
