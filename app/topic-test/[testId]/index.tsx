/**
 * Test lobby — parameters and instructions before the timer starts.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Play, Question, Timer, WarningCircle } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { fetchTestById, updateTestStatus } from '@/features/topic-test/api/topicTest';
import { syncTestFromSupabase } from '@/features/topic-test/services/testSyncService';
import { useAuth } from '@/providers/AuthProvider';
import { useGoals } from '@/providers/GoalProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import { md } from '@/shared/theme/material';
import type { TestSession } from '@/shared/types/storage';

const RULES: { id: string; text: string; warning?: boolean }[] = [
    { id: 'navigate', text: 'You can move between questions freely.' },
    { id: 'review', text: 'Use "Mark for review" if you are unsure about an answer.' },
    { id: 'timer', text: 'The timer starts immediately when you tap Start.', warning: true },
    { id: 'pause', text: 'Closing the app pauses the timer, but try to finish in one sitting.', warning: true },
];

export default function TopicTestLobby() {
    const { testId } = useLocalSearchParams<{ testId: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { userGoal } = useGoals();

    const [testData, setTestData] = useState<TestSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!testId) return;
        let active = true;

        const load = async () => {
            const { data, error } = await fetchTestById(testId);

            if (error || !data) {
                console.error('Error fetching test:', error);
                toast.error('Test not found');
                router.replace('/topic-test');
                return;
            }

            const session = data as unknown as TestSession;

            if (session.status === 'completed') {
                router.replace(`/topic-test/${testId}/result`);
                return;
            }

            if (active) {
                setTestData(session);
                setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [testId, router]);

    const handleStartTest = async () => {
        if (!testId || !testData) return;
        setStarting(true);

        try {
            if (testData.status === 'created') {
                const { error } = await updateTestStatus(testId, 'ongoing');
                if (error) throw error;
            }

            await syncTestFromSupabase(user?.id, userGoal?.branch_id);
            router.replace(`/topic-test/${testId}/attempt`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to start test. Please check your connection.');
            setStarting(false);
        }
    };

    if (loading) return <ModernLoader />;
    if (!testData) return null;

    const timeInMinutes = Math.floor(testData.remaining_time_seconds / 60);

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                <Pressable style={s.backBtn} onPress={() => router.replace('/topic-test')}>
                    <ArrowLeft size={15} color="#94a3b8" weight="bold" />
                    <Text style={s.backText}>Cancel &amp; exit</Text>
                </Pressable>

                <PageHeader
                    primaryTitle="Ready to"
                    secondaryTitle="Start?"
                    caption="Review the test parameters below."
                />

                <Animated.View entering={FadeInDown.duration(360)} style={s.paramRow}>
                    <View style={[s.param, s.paramBlue]}>
                        <Question size={18} color="#93c5fd" weight="bold" />
                        <Text style={s.paramText}>{testData.total_questions} questions</Text>
                    </View>
                    <View style={[s.param, s.paramOrange]}>
                        <Timer size={18} color="#fdba74" weight="bold" />
                        <Text style={s.paramText}>{timeInMinutes} min</Text>
                    </View>
                </Animated.View>

                {testData.topics?.length ? (
                    <Animated.View entering={FadeInDown.delay(80).duration(360)} style={s.topicsCard}>
                        <Text style={s.sectionLabel}>TOPICS</Text>
                        <View style={s.topicChips}>
                            {testData.topics.map((topic) => (
                                <View key={topic} style={s.topicChip}>
                                    <Text style={s.topicChipText}>{topic}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                ) : null}

                <Animated.View entering={FadeInDown.delay(140).duration(360)} style={s.rulesCard}>
                    <Text style={s.sectionLabel}>INSTRUCTIONS</Text>
                    {RULES.map((rule) => (
                        <View key={rule.id} style={s.ruleRow}>
                            {rule.warning ? (
                                <WarningCircle size={17} color="#fb923c" weight="fill" />
                            ) : (
                                <CheckCircle size={17} color="#4ade80" weight="fill" />
                            )}
                            <Text style={s.ruleText}>{rule.text}</Text>
                        </View>
                    ))}
                </Animated.View>
            </ScrollView>

            <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, md.space.lg) }]}>
                <Pressable
                    style={({ pressed }) => [s.startBtn, starting && s.disabled, pressed && s.pressed]}
                    onPress={handleStartTest}
                    disabled={starting}
                >
                    <Play size={17} color="#fff" weight="fill" />
                    <Text style={s.startText}>{starting ? 'Starting…' : 'Start test'}</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f172a' },
    content: { padding: 20, paddingBottom: 30, gap: 18 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 6 },
    backText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

    paramRow: { flexDirection: 'row', gap: 10 },
    param: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
    paramBlue: { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)' },
    paramOrange: { backgroundColor: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.25)' },
    paramText: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },

    sectionLabel: { color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    topicsCard: { borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#111c30', padding: 16, gap: 12 },
    topicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    topicChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b' },
    topicChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },

    rulesCard: { borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#111c30', padding: 16, gap: 12 },
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    ruleText: { flex: 1, color: '#cbd5e1', fontSize: 13, lineHeight: 20 },

    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#1e293b', backgroundColor: '#0b1220' },
    startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, borderRadius: 14, backgroundColor: '#2563eb' },
    startText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.6 },
    pressed: { transform: [{ scale: 0.99 }] },
});
