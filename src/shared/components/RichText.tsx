import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import HtmlView from './renderers/HtmlView';
import { buildContentHtml, needsRichRendering, toPlainText } from './renderers/contentHtml';
import { buildDocument } from './renderers/webviewShell';

type RichTextProps = {
    text: string | number | number[] | null | undefined;
    fontSize?: number;
    /** Extra style for the plain-text fast path. */
    textStyle?: StyleProp<TextStyle>;
    style?: StyleProp<ViewStyle>;
    numberOfLines?: number;
};

const CLOUDINARY = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Renders question content: LaTeX, code, tables, lists, inline HTML and images.
 *
 * Plain prose takes a native <Text> fast path; anything with markup goes through
 * HtmlView with KaTeX bundled offline, which is what gives the native app the
 * same typesetting as the PWA.
 */
function RichText({ text, fontSize = 15, textStyle, style, numberOfLines }: RichTextProps) {
    const raw = typeof text === 'string' ? text : text == null ? '' : String(text);
    const rich = needsRichRendering(raw);

    const html = useMemo(
        () => (rich ? buildDocument(buildContentHtml(raw, CLOUDINARY), fontSize) : ''),
        [raw, rich, fontSize]
    );

    const [height, setHeight] = useState(fontSize * 1.6);
    const onHeight = useCallback((h: number) => setHeight(h), []);

    if (!raw) return null;

    if (!rich) {
        return (
            <Text
                style={[styles.plain, { fontSize, lineHeight: fontSize * 1.55 }, textStyle]}
                numberOfLines={numberOfLines}
            >
                {toPlainText(raw)}
            </Text>
        );
    }

    return (
        <View style={[{ height }, style]}>
            <HtmlView html={html} onHeight={onHeight} />
        </View>
    );
}

const styles = StyleSheet.create({
    plain: { color: '#e2e8f0' },
});

export default React.memo(RichText);
