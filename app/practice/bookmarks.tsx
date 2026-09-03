/**
 * All bookmarked questions across subjects. Tapping one opens it in the normal
 * practice question screen for its subject.
 */
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookmarkSimple } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDifficultyColors, getDifficultyDisplayText } from '@/features/questions/utils/questionUtils';
import { toPlainText } from '@/shared/components/renderers/contentHtml';
import { onAppEvent } from '@/shared/utils/appEvents';
import { supabase } from '@/shared/utils/supabaseClient';

type BookmarkRow = {
    question_id: string;
    notes: string | null;
    created_at: string;
    question: string;
    subject_slug: string;
    subject_name: string;
    topic: string;
    question_type: string;
    difficulty: string;
};

export default function BookmarksScreen() {
    const router = useRouter();
    const [rows, setRows] = useState<BookmarkRow[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const { data, error } = await supabase.rpc('get_user_bookmarks', {});
            if (error) throw error;
            setRows((data ?? []) as BookmarkRow[]);
        } catch (err) {
            console.error('[bookmarks] load failed', err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        return onAppEvent('BOOKMARKS_UPDATED', () => void load());
    }, [load]);

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <View style={s.header}>
                <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/practice'))}
                    style={s.backBtn}
                    hitSlop={10}
                >
                    <ArrowLeft size={20} color="#94a3b8" weight="bold" />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Bookmarks</Text>
                    <Text style={s.subtitle}>{rows.length} saved question{rows.length === 1 ? '' : 's'}</Text>
                </View>
            </View>

            {loading ? (
                <View style={s.loading}>
                    <ActivityIndicator color="#3b82f6" />
                </View>
            ) : (
                <FlashList
                    data={rows}
                    keyExtractor={(item) => item.question_id}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                        const diff = getDifficultyColors(item.difficulty);
                        return (
                            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(280)}>
                                <Pressable
                                    style={({ pressed }) => [s.card, pressed && s.cardPressed]}
                                    onPress={() =>
                                        router.push(`/practice/${item.subject_slug}/${item.question_id}`)
                                    }
                                >
                                    <Text style={s.cardText} numberOfLines={3}>
                                        {toPlainText(item.question).replace(/\s+/g, ' ')}
                                    </Text>
                                    {item.notes ? (
                                        <View style={s.noteBox}>
                                            <BookmarkSimple size={12} color="#fbbf24" weight="fill" />
                                            <Text style={s.noteText} numberOfLines={2}>
                                                {item.notes}
                                            </Text>
                                        </View>
                                    ) : null}
                                    <View style={s.cardFooter}>
                                        <View style={[s.diffBadge, { backgroundColor: diff.bg }]}>
                                            <Text style={[s.diffText, { color: diff.text }]}>
                                                {getDifficultyDisplayText(item.difficulty)}
                                            </Text>
                                        </View>
                                        <Text style={s.cardMeta} numberOfLines={1}>
                                            {item.subject_name} · {item.topic}
                                        </Text>
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <BookmarkSimple size={30} color="#334155" weight="duotone" />
                            <Text style={s.emptyText}>
                                Nothing bookmarked yet. Tap the bookmark button on any question to save it here.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 12, marginTop: 2 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
    card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#243449', gap: 10 },
    cardPressed: { opacity: 0.85 },
    cardText: { color: '#e2e8f0', fontSize: 14, lineHeight: 21 },
    noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: 'rgba(245,158,11,0.1)', padding: 8, borderRadius: 8 },
    noteText: { color: '#fcd34d', fontSize: 12, flex: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    diffText: { fontSize: 11, fontWeight: '700' },
    cardMeta: { color: '#64748b', fontSize: 11, flexShrink: 1, textAlign: 'right' },
    empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 40, gap: 14 },
    emptyText: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
