/**
 * Topic Test hub — resume an active test, start a new one, and review history.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ChartLineUp, Clock, Play, Plus, Target, Timer, TrayArrowDown } from 'phosphor-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { updateTestStatus } from '@/features/topic-test/api/topicTest';
import useTopicTestHubData from '@/features/topic-test/hooks/useTopicTestHubData';
import { useAuth } from '@/providers/AuthProvider';
import { useGoals } from '@/providers/GoalProvider';
import Button from '@/shared/components/md/Button';
import Chip from '@/shared/components/md/Chip';
import IconButton from '@/shared/components/md/IconButton';
import { ModernLoader } from '@/shared/components/ModernLoader';
import { md } from '@/shared/theme/material';

const formatTestDate = (completedAt?: string | null) => {
    if (!completedAt) return 'Untitled test';
    const date = new Date(completedAt);
    return `${date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    })} · ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
};

export default function TopicTestHubScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { userGoal } = useGoals();
    const [starting, setStarting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { loading, activeTest, history, refresh } = useTopicTestHubData(
        user?.id,
        userGoal?.branch_id
    );

    useFocusEffect(
        useCallback(() => {
            void refresh();
        }, [refresh])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const summary = useMemo(() => {
        if (history.length === 0) return null;
        return {
            tests: history.length,
            avgAccuracy: Math.round(
                history.reduce((sum, t) => sum + (t.accuracy ?? 0), 0) / history.length
            ),
            bestScore: Math.max(...history.map((t) => t.accuracy ?? 0)),
        };
    }, [history]);

    const handleStart = async () => {
        if (!activeTest) return;
        setStarting(true);
        try {
            if (activeTest.status === 'created') {
                const { error } = await updateTestStatus(activeTest.id, 'ongoing');
                if (error) throw error;
            }
            router.push(`/topic-test/${activeTest.id}/attempt`);
        } catch (err) {
            console.error(err);
            toast.error('Could not start the test. Check your connection.');
        } finally {
            setStarting(false);
        }
    };

    if (loading) return <ModernLoader />;

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <View style={s.appBar}>
                <IconButton
                    onPress={() => router.push('/(tabs)/dashboard')}
                    accessibilityLabel="Back to dashboard"
                    icon={(c, size) => <ArrowLeft size={size} color={c} weight="bold" />}
                />
                <Text style={s.appBarTitle}>Topic tests</Text>
            </View>

            <ScrollView
                contentContainerStyle={s.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={md.color.primary}
                        colors={[md.color.primary]}
                    />
                }
            >
                {activeTest ? (
                    <View style={[s.card, s.activeCard]}>
                        <Chip
                            label={activeTest.status === 'created' ? 'Ready to start' : 'In progress'}
                            tone={{ bg: md.color.primaryContainer, fg: md.color.onPrimaryContainer }}
                            icon={(c, size) => <Clock size={size} color={c} weight="fill" />}
                        />
                        <Text style={s.cardTitle}>
                            {activeTest.total_questions} questions
                        </Text>
                        <Text style={s.cardBody} numberOfLines={2}>
                            {Math.round(activeTest.remaining_time_seconds / 60)} minutes remaining ·{' '}
                            {activeTest.topics?.slice(0, 3).join(', ') || 'Custom test'}
                        </Text>
                        <View style={s.cardActions}>
                            <Button
                                label={activeTest.status === 'created' ? 'Start test' : 'Resume'}
                                onPress={handleStart}
                                loading={starting}
                                icon={(c, size) => <Play size={size} color={c} weight="fill" />}
                                style={s.grow}
                            />
                            <Button
                                label="Details"
                                variant="outlined"
                                onPress={() => router.push(`/topic-test/${activeTest.id}`)}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Build a timed test</Text>
                        <Text style={s.cardBody}>
                            Pick the topics you are weakest at, choose a length, and get a
                            GATE-style paper with negative marking and a pacing report.
                        </Text>
                        <Button
                            label="Generate new test"
                            onPress={() => router.push('/topic-test/generate')}
                            icon={(c, size) => <Plus size={size} color={c} weight="bold" />}
                            fullWidth
                            style={s.cta}
                        />
                    </View>
                )}

                {summary && (
                    <View style={s.statRow}>
                        <View style={s.statTile}>
                            <ChartLineUp size={18} color={md.color.primary} weight="duotone" />
                            <Text style={s.statValue}>{summary.tests}</Text>
                            <Text style={s.statLabel}>Tests taken</Text>
                        </View>
                        <View style={s.statTile}>
                            <Target size={18} color={md.color.success} weight="duotone" />
                            <Text style={s.statValue}>{summary.avgAccuracy}%</Text>
                            <Text style={s.statLabel}>Avg accuracy</Text>
                        </View>
                        <View style={s.statTile}>
                            <Timer size={18} color={md.color.warning} weight="duotone" />
                            <Text style={s.statValue}>{summary.bestScore}%</Text>
                            <Text style={s.statLabel}>Best</Text>
                        </View>
                    </View>
                )}

                <View style={s.historySection}>
                    <Text style={s.sectionLabel}>PAST TESTS</Text>

                    {history.length === 0 ? (
                        <View style={s.emptyState}>
                            <TrayArrowDown size={28} color={md.color.onSurfaceVariant} weight="duotone" />
                            <Text style={s.emptyTitle}>No completed tests yet</Text>
                            <Text style={s.emptyBody}>
                                Finish a test and your score, pacing and weak topics show up here.
                            </Text>
                        </View>
                    ) : (
                        history.map((test) => (
                            <Pressable
                                key={test.id}
                                android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                                style={s.historyRow}
                                onPress={() => router.push(`/topic-test/${test.id}/result`)}
                            >
                                <View style={s.historyText}>
                                    <Text style={s.historyTitle}>
                                        {formatTestDate(test.completed_at)}
                                    </Text>
                                    <Text style={s.historyMeta} numberOfLines={1}>
                                        {test.topics?.slice(0, 3).join(', ') || 'Custom test'}
                                    </Text>
                                </View>
                                <View style={s.historyScore}>
                                    <Text style={s.historyScoreValue}>
                                        {test.score ?? 0}/{test.total_marks ?? 0}
                                    </Text>
                                    <Text style={s.historyScoreLabel}>{test.accuracy ?? 0}%</Text>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>
            </ScrollView>

            {activeTest && (
                <View style={s.bottomBar}>
                    <Text style={s.bottomHint} numberOfLines={1}>
                        Finish your active test to start a new one
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: md.color.surface },

    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.xs,
        height: 64,
        paddingHorizontal: md.space.sm,
    },
    appBarTitle: {
        ...md.type.titleLarge,
        color: md.color.onSurface,
        flex: 1,
        marginLeft: md.space.xs,
    },

    content: { padding: md.space.lg, paddingBottom: 120, gap: md.space.xl },

    card: {
        borderRadius: md.radius.lg,
        backgroundColor: md.color.surfaceContainerLow,
        borderWidth: 1,
        borderColor: md.color.outlineVariant,
        padding: md.space.xl,
        gap: md.space.md,
        alignItems: 'flex-start',
    },
    activeCard: { borderColor: md.color.primary },
    cardTitle: { ...md.type.titleLarge, color: md.color.onSurface },
    cardBody: { ...md.type.bodyMedium, color: md.color.onSurfaceVariant },
    cardActions: { flexDirection: 'row', gap: md.space.sm, alignSelf: 'stretch', marginTop: md.space.xs },
    cta: { marginTop: md.space.xs },
    grow: { flex: 1 },

    statRow: { flexDirection: 'row', gap: md.space.sm },
    statTile: {
        flex: 1,
        alignItems: 'center',
        gap: md.space.xs,
        paddingVertical: md.space.lg,
        borderRadius: md.radius.md,
        backgroundColor: md.color.surfaceContainerLow,
    },
    statValue: { ...md.type.titleMedium, color: md.color.onSurface },
    statLabel: { ...md.type.bodySmall, color: md.color.onSurfaceVariant },

    historySection: { gap: md.space.md },
    sectionLabel: { ...md.type.labelSmall, color: md.color.onSurfaceVariant, letterSpacing: 1 },

    emptyState: {
        alignItems: 'center',
        gap: md.space.sm,
        paddingVertical: md.space.xxl,
        paddingHorizontal: md.space.xl,
        borderRadius: md.radius.md,
        backgroundColor: md.color.surfaceContainerLow,
    },
    emptyTitle: { ...md.type.titleSmall, color: md.color.onSurface },
    emptyBody: {
        ...md.type.bodySmall,
        color: md.color.onSurfaceVariant,
        textAlign: 'center',
    },

    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.md,
        minHeight: 72,
        paddingHorizontal: md.space.lg,
        paddingVertical: md.space.md,
        borderRadius: md.radius.md,
        backgroundColor: md.color.surfaceContainerLow,
        overflow: 'hidden',
    },
    historyText: { flex: 1, gap: 2 },
    historyTitle: { ...md.type.titleSmall, color: md.color.onSurface },
    historyMeta: { ...md.type.bodySmall, color: md.color.onSurfaceVariant },
    historyScore: { alignItems: 'flex-end' },
    historyScoreValue: { ...md.type.titleSmall, color: md.color.primary },
    historyScoreLabel: { ...md.type.bodySmall, color: md.color.onSurfaceVariant },

    bottomBar: {
        paddingHorizontal: md.space.lg,
        paddingVertical: md.space.md,
        backgroundColor: md.color.surfaceContainer,
        borderTopWidth: 1,
        borderTopColor: md.color.outlineVariant,
    },
    bottomHint: { ...md.type.bodySmall, color: md.color.onSurfaceVariant, textAlign: 'center' },
});
