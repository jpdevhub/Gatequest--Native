import { useRouter } from 'expo-router';
import { ArrowRight, BookmarkSimple } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals, type Subject } from '@/providers/GoalProvider';
import { useStats } from '@/providers/StatsProvider';
import SubjectIcon from '@/shared/components/SubjectIcon';
import { getSubjectColors } from '@/shared/data/subjectIcons';
import type { SubjectStat } from '@/shared/types/Stats';

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
    Easy: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
    Medium: { bg: 'rgba(234,179,8,0.15)', text: '#facc15' },
    Hard: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
};

type FilterId = 'all' | 'core' | 'math' | 'aptitude';

function SubjectCard({
    subject,
    index,
    stat,
}: {
    subject: Subject;
    index: number;
    stat?: SubjectStat;
}) {
    const router = useRouter();
    const theme = getSubjectColors(subject.theme_color as string | undefined);
    const difficulty = subject.difficulty as string | undefined;
    const diffStyle = DIFF_COLORS[difficulty ?? 'Medium'] ?? DIFF_COLORS.Medium!;

    const total = stat?.total_available ?? 0;
    const attempted = stat?.attempted ?? 0;
    const progress = Math.min(100, Math.round(Number(stat?.progress ?? 0)));
    const accuracy = Math.round(Number(stat?.accuracy ?? 0));

    return (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(380)}>
            <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/practice/${subject.slug}`)}
            >
                <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                        <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
                            <SubjectIcon name={subject.icon_name as string | undefined} size={22} color={theme.fg} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardName}>{subject.name}</Text>
                            <View style={styles.metaRow}>
                                {difficulty && (
                                    <View style={[styles.badge, { backgroundColor: diffStyle.bg }]}>
                                        <Text style={[styles.badgeText, { color: diffStyle.text }]}>
                                            {difficulty}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.qCount}>
                                    {total > 0 ? `${attempted}/${total} attempted` : 'Tap to load'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <ArrowRight size={18} color="#334155" weight="bold" />
                </View>

                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                    Progress: {progress}%{total > 0 ? `  ·  Accuracy: ${accuracy}%` : ''}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

export default function PracticeScreen() {
    const { userGoal, getPracticeSubjects, loading } = useGoals();
    const { stats } = useStats();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<FilterId>('all');

    const tabs = useMemo(
        () => [
            { id: 'all' as const, label: 'All Subjects' },
            { id: 'core' as const, label: `Core ${(userGoal?.branch_id ?? 'CS').toUpperCase()}` },
            { id: 'math' as const, label: 'Mathematics' },
            { id: 'aptitude' as const, label: 'Aptitude' },
        ],
        [userGoal]
    );

    const statByName = useMemo(() => {
        const map = new Map<string, SubjectStat>();
        for (const stat of stats.subjectStats ?? []) {
            if (stat.subject_slug) map.set(stat.subject_slug, stat);
        }
        return map;
    }, [stats.subjectStats]);

    const subjects = useMemo(() => {
        const all = getPracticeSubjects();
        if (activeFilter === 'all') return all;
        return all.filter((s) => s.category === activeFilter);
    }, [getPracticeSubjects, activeFilter]);

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View entering={FadeInDown.duration(420)} style={styles.header}>
                <Text style={styles.headerTitle}>
                    Practice by <Text style={styles.headerAccent}>Subject</Text>
                </Text>
                <Text style={styles.headerSub}>Select a subject and start practicing.</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(360)}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsScroll}
                    contentContainerStyle={styles.tabsRow}
                >
                    {tabs.map((tab) => (
                        <Pressable
                            key={tab.id}
                            style={[styles.tab, activeFilter === tab.id && styles.tabActive]}
                            onPress={() => setActiveFilter(tab.id)}
                        >
                            <Text style={[styles.tabText, activeFilter === tab.id && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                    <Pressable style={styles.tab} onPress={() => router.push('/practice/bookmarks')}>
                        <BookmarkSimple size={13} color="#64748b" />
                        <Text style={styles.tabText}>Bookmarked</Text>
                    </Pressable>
                </ScrollView>
            </Animated.View>

            <FlatList
                data={subjects}
                keyExtractor={(s) => s.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <SubjectCard
                        subject={item}
                        index={index}
                        stat={statByName.get(item.slug as string)}
                    />
                )}
                ListEmptyComponent={
                    !loading ? (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.empty}>
                            <Text style={styles.emptyText}>
                                {userGoal
                                    ? 'No subjects found for this filter.'
                                    : 'Set your goal in settings to see subjects.'}
                            </Text>
                        </Animated.View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { color: '#f1f5f9', fontSize: 28, fontWeight: '800' },
    headerAccent: { color: '#3b82f6' },
    headerSub: { color: '#64748b', fontSize: 13, marginTop: 4 },

    tabsScroll: { flexGrow: 0, flexShrink: 0 },
    tabsRow: { paddingHorizontal: 20, paddingVertical: 4, gap: 8, flexDirection: 'row', alignItems: 'center' },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b',
    },
    tabActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
    tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#3b82f6' },

    list: { padding: 20, paddingBottom: 110, gap: 12 },

    card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155' },
    cardPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1, gap: 6 },
    cardName: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    qCount: { color: '#475569', fontSize: 11 },

    progressTrack: { height: 4, backgroundColor: '#334155', borderRadius: 99, overflow: 'hidden', marginBottom: 4, marginTop: 10 },
    progressFill: { height: 4, backgroundColor: '#3b82f6', borderRadius: 99 },
    progressLabel: { color: '#475569', fontSize: 11 },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: '#475569', fontSize: 14, textAlign: 'center' },
});
