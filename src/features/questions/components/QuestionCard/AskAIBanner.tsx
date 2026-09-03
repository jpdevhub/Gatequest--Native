import { ArrowSquareOut, ChatTeardropText, X } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { AIProvider } from '@/shared/types/Settings';
import { AI_PROVIDERS } from '@/shared/utils/aiPromptUtils';

type AskAIBannerProps = {
    provider: AIProvider;
    onPress: (doubt?: string) => void;
};

export default function AskAIBanner({ provider, onPress }: AskAIBannerProps) {
    const [showDoubtField, setShowDoubtField] = useState(false);
    const [doubt, setDoubt] = useState('');

    const ui = AI_PROVIDERS[provider] ?? AI_PROVIDERS.chatgpt;

    return (
        <Animated.View entering={FadeInDown.duration(240)} style={s.wrap}>
            <View style={s.topRow}>
                <View style={[s.badge, { backgroundColor: ui.accent }]}>
                    <Text style={s.badgeText}>{ui.label.charAt(0)}</Text>
                </View>
                <View style={s.copy}>
                    <Text style={s.title}>Stuck on this question?</Text>
                    <Text style={s.sub}>Get a step-by-step explanation via {ui.label}</Text>
                </View>
            </View>

            <View style={s.actions}>
                {!showDoubtField && (
                    <Pressable style={s.ghostBtn} onPress={() => setShowDoubtField(true)}>
                        <ChatTeardropText size={15} color="#94a3b8" />
                        <Text style={s.ghostText}>Add doubt</Text>
                    </Pressable>
                )}
                <Pressable
                    style={({ pressed }) => [s.cta, { backgroundColor: ui.accent }, pressed && s.pressed]}
                    onPress={() => onPress(doubt)}
                >
                    <Text style={s.ctaText}>Ask {ui.label}</Text>
                    <ArrowSquareOut size={15} color="#fff" weight="bold" />
                </Pressable>
            </View>

            {showDoubtField && (
                <Animated.View entering={FadeInDown.duration(180)} style={s.doubtBox}>
                    <View style={s.doubtHeader}>
                        <Text style={s.doubtLabel}>Your specific doubt (optional)</Text>
                        <Pressable
                            hitSlop={10}
                            onPress={() => {
                                setShowDoubtField(false);
                                setDoubt('');
                            }}
                        >
                            <X size={14} color="#64748b" />
                        </Pressable>
                    </View>
                    <TextInput
                        value={doubt}
                        onChangeText={setDoubt}
                        multiline
                        placeholder="e.g. Why is option B incorrect?"
                        placeholderTextColor="#475569"
                        style={s.input}
                    />
                </Animated.View>
            )}
        </Animated.View>
    );
}

const s = StyleSheet.create({
    wrap: {
        marginTop: 18,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
        backgroundColor: '#111c30',
        gap: 12,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    badge: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    copy: { flex: 1 },
    title: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
    sub: { color: '#64748b', fontSize: 12, marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 10 },
    ghostText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    cta: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 11, borderRadius: 10,
    },
    pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
    ctaText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    doubtBox: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12, gap: 8 },
    doubtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    doubtLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
    input: {
        minHeight: 72, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b',
        backgroundColor: '#0b1220', color: '#e2e8f0', padding: 12, fontSize: 14,
        textAlignVertical: 'top',
    },
});
