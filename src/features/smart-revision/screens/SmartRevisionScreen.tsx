/**
 * Smart Revision home — mirrors the PWA's SmartRevisionPage states:
 * active set, concluded set, critical errors detected, or all clear.
 */
import { useRouter } from 'expo-router';
import {
    ArrowLeft, CheckCircle, Clock, Fire, Lightning, ShieldCheck, Sparkle,
} from 'phosphor-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSmartRevision from '@/features/smart-revision/hooks/useSmartRevision';
import { ModernLoader } from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';

const getTimeRemaining = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining before expiry`;
    if (minutes > 0) return `${minutes}m remaining before expiry`;
    return 'Less than 1 minute remaining';
};

const INFO = [
    { title: 'Targets your misses', body: 'Questions you got wrong are queued for a second pass at the right time.' },
    { title: 'One set a week', body: 'A fresh set unlocks every week so revision stays a habit, not a backlog.' },
    { title: 'Expires on purpose', body: 'Sets expire so you revise while the mistake is still fresh.' },
];

export default function SmartRevisionScreen() {
    const router = useRouter();
    const { loading, currentSet, generateSet, startSet, criticalQuestionsCount } = useSmartRevision();

    if (loading && !currentSet) return <ModernLoader />;

    const isActiveSet = currentSet && currentSet.status !== 'completed';
    const isExpiredSet = currentSet && currentSet.status === 'completed';
    const hasCriticalQuestions = criticalQuestionsCount > 0;

    const handleStart = async () => {
        const setId = await startSet();
        if (setId) router.push(`/revision/${setId}`);
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                <Pressable style={s.backBtn} onPress={() => router.push('/(tabs)/dashboard')}>
                    <ArrowLeft size={15} color="#94a3b8" weight="bold" />
                    <Text style={s.backText}>Dashboard</Text>
                </Pressable>

                <PageHeader
                    primaryTitle="Smart"
                    secondaryTitle="Revision"
                    caption="Your targeted weakness engine. Eliminate critical errors."
                />

                <Animated.View entering={FadeInDown.duration(420)} style={s.hero}>
                    {isActiveSet ? (
                        <Animated.View key="active" entering={FadeIn.duration(280)} style={s.heroInner}>
                            <View style={[s.pill, s.pillBlue]}>
                                <Clock size={14} color="#60a5fa" weight="bold" />
                                <Text style={s.pillBlueText}>ACTIVE REVISION SESSION</Text>
                            </View>
                            <Text style={s.heroTitle}>Weekly set in progress</Text>
                            <Text style={s.heroSub}>
                                {currentSet?.expires_at
                                    ? getTimeRemaining(currentSet.expires_at)
                                    : 'Expires next Sunday or 24 hours after launch.'}
                            </Text>
                            <View style={s.statRow}>
                                <View style={s.statTile}>
                                    <Text style={s.statValue}>{currentSet?.total_questions ?? 0}</Text>
                                    <Text style={s.statLabel}>Questions</Text>
                                </View>
                                <View style={s.statTile}>
                                    <Text style={s.statValue}>{currentSet?.correct_count ?? 0}</Text>
                                    <Text style={s.statLabel}>Correct</Text>
                                </View>
                                <View style={s.statTile}>
                                    <Text style={s.statValue}>{Math.round(currentSet?.accuracy ?? 0)}%</Text>
                                    <Text style={s.statLabel}>Accuracy</Text>
                                </View>
                            </View>
                            <Pressable
                                style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
                                onPress={handleStart}
                            >
                                <Lightning size={17} color="#fff" weight="fill" />
                                <Text style={s.ctaText}>
                                    {currentSet?.status === 'pending'
                                        ? 'Launch revision session'
                                        : 'Resume revision session'}
                                </Text>
                            </Pressable>
                        </Animated.View>
                    ) : isExpiredSet ? (
                        <Animated.View key="done" entering={FadeIn.duration(280)} style={s.heroInner}>
                            <View style={s.iconCircleSlate}>
                                <ShieldCheck size={32} color="#94a3b8" weight="duotone" />
                            </View>
                            <Text style={s.heroTitle}>Weekly set concluded</Text>
                            <Text style={s.heroSub}>
                                You have finished this week&apos;s recovery sequence. The next set unlocks
                                next week.
                            </Text>
                        </Animated.View>
                    ) : hasCriticalQuestions ? (
                        <Animated.View key="critical" entering={FadeIn.duration(280)} style={s.heroInner}>
                            <View style={[s.pill, s.pillOrange]}>
                                <Fire size={14} color="#fb923c" weight="fill" />
                                <Text style={s.pillOrangeText}>
                                    {criticalQuestionsCount} CRITICAL ERROR(S) DETECTED
                                </Text>
                            </View>
                            <Text style={s.heroTitle}>Ready to recover marks?</Text>
                            <Text style={s.heroSub}>
                                Generate a revision queue targeted at your recent missteps.
                            </Text>
                            <Pressable
                                style={({ pressed }) => [s.cta, pressed && s.ctaPressed, loading && s.ctaDisabled]}
                                onPress={generateSet}
                                disabled={loading}
                            >
                                <Sparkle size={17} color="#fff" weight="fill" />
                                <Text style={s.ctaText}>Generate focused set</Text>
                            </Pressable>
                        </Animated.View>
                    ) : (
                        <Animated.View key="clear" entering={FadeIn.duration(280)} style={s.heroInner}>
                            <View style={s.iconCircleGreen}>
                                <CheckCircle size={32} color="#34d399" weight="duotone" />
                            </View>
                            <Text style={s.heroTitle}>All clear this week!</Text>
                            <Text style={s.heroSub}>
                                No pending critical questions detected. Great job keeping your retention
                                rate high.
                            </Text>
                        </Animated.View>
                    )}
                </Animated.View>

                <View style={s.infoList}>
                    {INFO.map((item, i) => (
                        <Animated.View
                            key={item.title}
                            entering={FadeInDown.delay(120 + i * 70).duration(360)}
                            style={s.infoCard}
                        >
                            <Text style={s.infoTitle}>{item.title}</Text>
                            <Text style={s.infoBody}>{item.body}</Text>
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f172a' },
    content: { padding: 20, paddingBottom: 120, gap: 20 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 6 },
    backText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

    hero: {
        borderRadius: 18, borderWidth: 1, borderColor: '#1e293b',
        backgroundColor: '#111c30', padding: 24,
    },
    heroInner: { alignItems: 'center', gap: 12 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    pillBlue: { borderColor: 'rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.1)' },
    pillBlueText: { color: '#60a5fa', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    pillOrange: { borderColor: 'rgba(249,115,22,0.3)', backgroundColor: 'rgba(249,115,22,0.1)' },
    pillOrangeText: { color: '#fb923c', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    heroTitle: { color: '#f1f5f9', fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4 },
    heroSub: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    iconCircleSlate: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(148,163,184,0.12)', alignItems: 'center', justifyContent: 'center' },
    iconCircleGreen: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' },

    statRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 4 },
    statTile: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0b1220' },
    statValue: { color: '#e2e8f0', fontSize: 18, fontWeight: '800' },
    statLabel: { color: '#64748b', fontSize: 11 },

    cta: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
        alignSelf: 'stretch', height: 50, borderRadius: 12, backgroundColor: '#2563eb', marginTop: 6,
    },
    ctaPressed: { transform: [{ scale: 0.985 }], backgroundColor: '#1d4ed8' },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    infoList: { gap: 10 },
    infoCard: { borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#111c30', padding: 16, gap: 4 },
    infoTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
    infoBody: { color: '#64748b', fontSize: 12, lineHeight: 19 },
});
