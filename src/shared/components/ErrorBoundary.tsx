import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: React.ReactNode; label?: string };
type State = { error: Error | null };

/**
 * Keeps one broken screen from taking down the whole app. Supabase being
 * unreachable, or a malformed question, shows a retry instead of a white screen.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`[${this.props.label ?? 'app'}] render failed`, error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <View style={s.wrap}>
                <Text style={s.title}>Something went wrong</Text>
                <Text style={s.body}>
                    {this.state.error.message || 'This screen could not be displayed.'}
                </Text>
                <Pressable style={s.btn} onPress={() => this.setState({ error: null })}>
                    <Text style={s.btnText}>Try again</Text>
                </Pressable>
            </View>
        );
    }
}

const s = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, backgroundColor: '#0f172a' },
    title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
    body: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    btn: { marginTop: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2563eb' },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
