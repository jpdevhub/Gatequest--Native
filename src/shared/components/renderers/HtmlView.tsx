import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type HtmlViewHandle = {
    /** Pushes option/reveal state into the already-rendered document. */
    applyState: (state: unknown) => void;
};

export type HtmlViewProps = {
    html: string;
    onHeight?: (height: number) => void;
    onSelect?: (index: number) => void;
    onReady?: () => void;
};

/**
 * Renders a self-contained HTML document.
 *
 * Native uses a WebView; the `.web.tsx` sibling uses an iframe, because
 * react-native-webview has no web implementation and renders an error stub there.
 * Both speak the same message protocol defined in `webviewShell.ts`.
 */
function HtmlViewInner(
    { html, onHeight, onSelect, onReady }: HtmlViewProps,
    ref: React.Ref<HtmlViewHandle>
) {
    const webRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
        applyState(state) {
            webRef.current?.injectJavaScript(
                `window.applyState && window.applyState(${JSON.stringify(state)}); true;`
            );
        },
    }));

    return (
        <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            style={styles.webview}
            containerStyle={styles.container}
            scrollEnabled={false}
            nestedScrollEnabled
            javaScriptEnabled
            androidLayerType="hardware"
            setSupportMultipleWindows={false}
            showsVerticalScrollIndicator={false}
            onLoadEnd={onReady}
            onShouldStartLoadWithRequest={(request) => {
                // The document is inline, so any http(s) navigation is a link tap
                // inside question content: send it to the browser instead of
                // replacing the rendered question.
                if (/^https?:/i.test(request.url)) {
                    void Linking.openURL(request.url);
                    return false;
                }
                return true;
            }}
            onMessage={(event) => {
                try {
                    const payload = JSON.parse(event.nativeEvent.data);
                    if (payload.type === 'height' && payload.height > 0) onHeight?.(payload.height);
                    else if (payload.type === 'select') onSelect?.(payload.index);
                } catch {
                    // Ignore malformed messages.
                }
            }}
        />
    );
}

const styles = StyleSheet.create({
    webview: { backgroundColor: 'transparent', flex: 1 },
    container: { backgroundColor: 'transparent' },
});

export default forwardRef<HtmlViewHandle, HtmlViewProps>(HtmlViewInner);
