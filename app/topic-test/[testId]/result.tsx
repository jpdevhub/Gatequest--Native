/**
 * Test performance report: score, accuracy, pacing, and per-topic / per-difficulty
 * breakdowns, with a tappable grid into the solution review.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft, Clock, ListChecks, Shapes, Target, Timer, Trophy, WarningCircle,
} from 'phosphor-react-native';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTestResult, { type AttemptWithQuestion } from '@/features/topic-test/hooks/useTestResult';
import { ModernLoader } from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import { formatTime } from '@/shared/utils/helper';

type GroupData = { attempts: AttemptWithQuestion[]; totalTime: number; correct: number };

function StatCard({
    label, value, subValue, icon: Icon,
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
}) {
    return (
        <View style={s.statCard}>
            <View style={{ flex: 1 }}>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={s.statValue}>{value}</Text>
                {subValue ? <Text style={s.statSub}>{subValue}</Text> : null}
            </View>
            <Icon size={20} color="#60a5fa" weight="duotone" />
        </View>
    );
}

export default function TopicTestResultScreen() {
    const { testId } = useLocalSearchParams<{ testId: string }>();
    const router = useRouter();
    const { session, attempts, loading, error, notCompleted } = useTestResult(testId);

    useEffect(() => {
        if (notCompleted) router.replace('/topic-test');
    }, [notCompleted, router]);

    const analysis = useMemo(() => {
        const diffGroups: Record<string, GroupData> = {
            Easy: { attempts: [], totalTime: 0, correct: 0 },
            Medium: { attempts: [], totalTime: 0, correct: 0 },
            Hard: { attempts: [], totalTime: 0, correct: 0 },
        };
        const topicGroups: Record<string, GroupData> = {};
        const typeGroups: Record<string, { total: number; correct: number }> = {
            MCQ: { total: 0, correct: 0 },
            MSQ: { total: 0, correct: 0 },
            NAT: { total: 0, correct: 0 },
        };

        attempts.forEach((a) => {
            const q = a.questions;
            const diff = q?.difficulty || 'Medium';
            const topic = q?.topic || 'Uncategorised';
            const type =
                q?.question_type === 'multiple-choice'
                    ? 'MCQ'
                    : q?.question_type === 'multiple-select'
                      ? 'MSQ'
                      : 'NAT';

            if (diffGroups[diff]) {
                diffGroups[diff].attempts.push(a);
                diffGroups[diff].totalTime += a.time_spent_seconds || 0;
                if (a.is_correct) diffGroups[diff].correct++;
            }

            if (!topicGroups[topic]) topicGroups[topic] = { attempts: [], totalTime: 0, correct: 0 };
            topicGroups[topic].attempts.push(a);
            topicGroups[topic].totalTime += a.time_spent_seconds || 0;
            if (a.is_correct) topicGroups[topic].correct++;

            if (typeGroups[type]) {
                typeGroups[type].total++;
                if (a.is_correct) typeGroups[type].correct++;
            }
        });

        const totalTime = attempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0);
        const globalAvg = totalTime / (attempts.length || 1);

        const timeSinks = attempts
            .filter((a) => !a.is_correct && (a.time_spent_seconds || 0) > globalAvg * 1.5)
            .sort((a, b) => (b.time_spent_seconds || 0) - (a.time_spent_seconds || 0))
            .slice(0, 3);

        return { diffGroups, topicGroups, typeGroups, timeSinks, totalTime };
    }, [attempts]);

    if (loading) return <ModernLoader />;

    if (error) {
        return (
            <SafeAreaView style={s.safe}>
                <View style={s.errorBox}>
                    <WarningCircle size={30} color="#f87171" weight="duotone" />
                    <Text style={s.errorText}>{error}</Text>
                    <Pressable style={s.errorBtn} onPress={() => router.replace('/topic-test')}>
                        <Text style={s.errorBtnText}>Back to tests</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    if (!session) return null;

    const attempted = attempts.filter((a) => a.status === 'answered').length;
    const correct = attempts.filter((a) => a.is_correct).length;
    const incorrect = attempted - correct;
    const unattempted = attempts.length - attempted;

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                <Pressable style={s.backBtn} onPress={() => router.replace('/topic-test')}>
                    <ArrowLeft size={15} color="#94a3b8" weight="bold" />
                    <Text style={s.backText}>Exit report</Text>
                </Pressable>

                <PageHeader
                    primaryTitle="Performance"
                    secondaryTitle="Report"
                    caption={session.topics?.slice(0, 6).join(', ') || 'Custom test'}
                />

                <Animated.View entering={FadeInDown.duration(360)} style={s.scoreCard}>
                    <Text style={s.scoreValue}>
                        {session.score ?? 0}
                        <Text style={s.scoreTotal}> / {session.total_marks ?? 0}</Text>
                    </Text>
                    <Text style={s.scoreLabel}>Total score</Text>
                    <View style={s.pillRow}>
                        <View style={[s.pill, s.pillGreen]}>
                            <Text style={s.pillText}>{correct} correct</Text>
                        </View>
                        <View style={[s.pill, s.pillRed]}>
                            <Text style={s.pillText}>{incorrect} wrong</Text>
                        </View>
                        <View style={[s.pill, s.pillSlate]}>
                            <Text style={s.pillText}>{unattempted} skipped</Text>
                        </View>
                    </View>
                </Animated.View>

                <View style={s.statGrid}>
                    <StatCard label="Accuracy" value={`${session.accuracy ?? 0}%`} icon={Target} />
                    <StatCard
                        label="Time spent"
                        value={formatTime(analysis.totalTime)}
                        subValue={`${formatTime(Math.round(analysis.totalTime / (attempts.length || 1)))} / question`}
                        icon={Clock}
                    />
                </View>

                <Animated.View entering={FadeInDown.delay(80).duration(360)} style={s.section}>
                    <View style={s.sectionHeader}>
                        <ListChecks size={18} color="#60a5fa" weight="duotone" />
                        <Text style={s.sectionTitle}>Question review</Text>
                    </View>
                    <View style={s.grid}>
                        {attempts.map((attempt, index) => {
                            const style =
                                attempt.status !== 'answered'
                                    ? s.cellSkipped
                                    : attempt.is_correct
                                      ? s.cellCorrect
                                      : s.cellWrong;
                            return (
                                <Pressable
                                    key={attempt.question_id}
                                    style={[s.cell, style]}
                                    onPress={() => router.push(`/topic-test/${testId}/review/${index}`)}
                                >
                                    <Text style={s.cellText}>{index + 1}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(140).duration(360)} style={s.section}>
                    <View style={s.sectionHeader}>
                        <Shapes size={18} color="#c084fc" weight="duotone" />
                        <Text style={s.sectionTitle}>By difficulty</Text>
                    </View>
                    {Object.entries(analysis.diffGroups).map(([diff, group]) =>
                        group.attempts.length === 0 ? null : (
                            <View key={diff} style={s.breakdownRow}>
                                <Text style={s.breakdownName}>{diff}</Text>
                                <View style={s.breakdownTrack}>
                                    <View
                                        style={[
                                            s.breakdownFill,
                                            {
                                                width: `${Math.round(
                                                    (group.correct / group.attempts.length) * 100
                                                )}%`,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={s.breakdownValue}>
                                    {group.correct}/{group.attempts.length}
                                </Text>
                            </View>
                        )
                    )}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(360)} style={s.section}>
                    <View style={s.sectionHeader}>
                        <Trophy size={18} color="#fbbf24" weight="duotone" />
                        <Text style={s.sectionTitle}>By topic</Text>
                    </View>
                    {Object.entries(analysis.topicGroups).map(([topic, group]) => (
                        <View key={topic} style={s.breakdownRow}>
                            <Text style={s.breakdownName} numberOfLines={1}>
                                {topic}
                            </Text>
                            <View style={s.breakdownTrack}>
                                <View
                                    style={[
                                        s.breakdownFill,
                                        {
                                            width: `${Math.round(
                                                (group.correct / group.attempts.length) * 100
                                            )}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={s.breakdownValue}>
                                {group.correct}/{group.attempts.length}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {analysis.timeSinks.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(260).duration(360)} style={s.section}>
                        <View style={s.sectionHeader}>
                            <Timer size={18} color="#f87171" weight="duotone" />
                            <Text style={s.sectionTitle}>Time sinks</Text>
                        </View>
                        <Text style={s.sectionSub}>
                            Wrong answers that also cost you the most time.
                        </Text>
                        {analysis.timeSinks.map((attempt) => {
                            const index = attempts.findIndex(
                                (a) => a.question_id === attempt.question_id
                            );
                            return (
                                <Pressable
                                    key={attempt.question_id}
                                    style={s.sinkRow}
                                    onPress={() => router.push(`/topic-test/${testId}/review/${index}`)}
                                >
                                    <Text style={s.sinkIndex}>Q{index + 1}</Text>
                                    <Text style={s.sinkTopic} numberOfLines={1}>
                                        {attempt.questions?.topic || 'Uncategorised'}
                                    </Text>
                                    <Text style={s.sinkTime}>
                                        {formatTime(attempt.time_spent_seconds || 0)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </Animated.View>
                )}

                <Pressable
                    style={({ pressed }) => [s.reviewBtn, pressed && s.pressed]}
                    onPress={() => router.push(`/topic-test/${testId}/review/0`)}
                >
                    <Text style={s.reviewBtnText}>Review answers</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f172a' },
    content: { padding: 20, paddingBottom: 120, gap: 18 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 6 },
    backText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

    scoreCard: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#111c30' },
    scoreValue: { color: '#f1f5f9', fontSize: 42, fontWeight: '800', letterSpacing: -1 },
    scoreTotal: { color: '#475569', fontSize: 22, fontWeight: '700' },
    scoreLabel: { color: '#64748b', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' },
    pillRow: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    pillGreen: { backgroundColor: 'rgba(34,197,94,0.16)' },
    pillRed: { backgroundColor: 'rgba(239,68,68,0.16)' },
    pillSlate: { backgroundColor: 'rgba(100,116,139,0.18)' },
    pillText: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },

    statGrid: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#111c30' },
    statLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
    statValue: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginTop: 4 },
    statSub: { color: '#475569', fontSize: 11, marginTop: 2 },

    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
    sectionSub: { color: '#64748b', fontSize: 12 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cell: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cellCorrect: { backgroundColor: '#16a34a' },
    cellWrong: { backgroundColor: '#dc2626' },
    cellSkipped: { backgroundColor: '#334155' },
    cellText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    breakdownName: { color: '#cbd5e1', fontSize: 12, width: 110 },
    breakdownTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: '#1e293b', overflow: 'hidden' },
    breakdownFill: { height: 7, borderRadius: 4, backgroundColor: '#3b82f6' },
    breakdownValue: { color: '#64748b', fontSize: 11, fontWeight: '700', width: 44, textAlign: 'right' },

    sinkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#1e293b' },
    sinkIndex: { color: '#f87171', fontSize: 12, fontWeight: '800', width: 34 },
    sinkTopic: { flex: 1, color: '#cbd5e1', fontSize: 12 },
    sinkTime: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },

    reviewBtn: { height: 50, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
    reviewBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    pressed: { transform: [{ scale: 0.99 }] },

    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 },
    errorText: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
    errorBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, backgroundColor: '#1e293b' },
    errorBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
});
