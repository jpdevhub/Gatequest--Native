/**
 * Test generator: pick a subject, pick topics, size the test, generate.
 * Calls the same `generate_topic_test` RPC as the PWA.
 */
import { useRouter } from 'expo-router';
import { ArrowLeft, CaretDown, Check, Minus, Plus } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { generateTopicTest } from '@/features/topic-test/api/topicTest';
import TopicsSelection from '@/features/topic-test/components/TopicsSelection';
import { useTopicTestGenerator } from '@/features/topic-test/hooks/useTopicTestGenerator';
import { syncTestFromSupabase } from '@/features/topic-test/services/testSyncService';
import { useAuth } from '@/providers/AuthProvider';
import { useGoals } from '@/providers/GoalProvider';
import Button from '@/shared/components/md/Button';
import IconButton from '@/shared/components/md/IconButton';
import SubjectIcon from '@/shared/components/SubjectIcon';
import { md } from '@/shared/theme/material';

const QUESTION_STEPS = [5, 10, 15, 20, 25, 30, 40, 50];

export default function TopicTestGenerateScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { getPracticeSubjects, userGoal } = useGoals();
    const subjects = getPracticeSubjects();

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
    const [questionLimit, setQuestionLimit] = useState(20);
    const [includeAttempted, setIncludeAttempted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const {
        availableTopics,
        selectedTopics,
        poolSize,
        loading,
        warnings,
        canGenerate,
        toggleTopic,
        toggleMany,
    } = useTopicTestGenerator({
        subjectId: selectedSubjectId,
        requestedQuestionCount: questionLimit,
        includeAttempted,
    });

    const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

    const finalQuestionCount = useMemo(
        () => Math.min(questionLimit, poolSize),
        [questionLimit, poolSize]
    );
    // Matches the PWA's pacing estimate: ~2.76 minutes per question.
    const estimatedTime = Math.ceil(finalQuestionCount * 2.76);

    const stepQuestions = (direction: 1 | -1) => {
        const current = QUESTION_STEPS.indexOf(questionLimit);
        const next = Math.min(
            QUESTION_STEPS.length - 1,
            Math.max(0, (current === -1 ? 3 : current) + direction)
        );
        setQuestionLimit(QUESTION_STEPS[next]!);
    };

    const handleStartTest = async () => {
        if (!canGenerate || !userGoal?.branch_id) {
            toast.error('Not enough questions in the selected topics.');
            return;
        }

        setIsGenerating(true);
        try {
            const filters = selectedTopics.map((t) => ({
                subject_id: t.subjectId,
                topic: t.name,
            }));

            const { data, error } = await generateTopicTest(
                filters,
                finalQuestionCount,
                estimatedTime * 60,
                includeAttempted,
                userGoal.branch_id
            );

            if (error) throw error;

            if (data?.error && data.status === 'active_exists') {
                toast.info('You already have an active test.');
                router.replace(`/topic-test/${data.test_id}`);
                return;
            }

            if (!data?.test_id) throw new Error('No test id returned');

            await syncTestFromSupabase(user?.id, userGoal.branch_id);
            router.replace(`/topic-test/${data.test_id}`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate test.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            {/* Top app bar */}
            <View style={s.appBar}>
                <IconButton
                    onPress={() => router.back()}
                    accessibilityLabel="Back"
                    icon={(c, size) => <ArrowLeft size={size} color={c} weight="bold" />}
                />
                <Text style={s.appBarTitle}>New topic test</Text>
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                {warnings.length > 0 && (
                    <View style={s.warning}>
                        {warnings.map((w) => (
                            <Text key={w} style={s.warningText}>
                                {w}
                            </Text>
                        ))}
                    </View>
                )}

                {/* Subject */}
                <View style={s.section}>
                    <Text style={s.sectionLabel}>SUBJECT</Text>
                    <Pressable
                        onPress={() => setSubjectPickerOpen(true)}
                        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                        style={s.select}
                    >
                        {selectedSubject ? (
                            <>
                                <SubjectIcon
                                    name={selectedSubject.icon_name as string | undefined}
                                    size={20}
                                    color={md.color.primary}
                                />
                                <Text style={s.selectValue} numberOfLines={1}>
                                    {selectedSubject.name as string}
                                </Text>
                            </>
                        ) : (
                            <Text style={s.selectPlaceholder}>Choose a subject</Text>
                        )}
                        <CaretDown size={16} color={md.color.onSurfaceVariant} weight="bold" />
                    </Pressable>
                </View>

                {/* Topics */}
                {selectedSubjectId && (
                    <TopicsSelection
                        availableTopics={availableTopics}
                        selectedTopics={selectedTopics}
                        isLoading={loading}
                        includeAttempted={includeAttempted}
                        onToggle={toggleTopic}
                        onToggleAll={toggleMany}
                    />
                )}

                {/* Configuration */}
                <View style={s.section}>
                    <Text style={s.sectionLabel}>CONFIGURATION</Text>

                    <View style={s.card}>
                        <View style={s.row}>
                            <View style={s.rowText}>
                                <Text style={s.rowTitle}>Questions</Text>
                                <Text style={s.rowSub}>
                                    {poolSize} available in selected topics
                                </Text>
                            </View>
                            <View style={s.stepper}>
                                <IconButton
                                    onPress={() => stepQuestions(-1)}
                                    accessibilityLabel="Fewer questions"
                                    variant="tonal"
                                    icon={(c, size) => <Minus size={size} color={c} weight="bold" />}
                                />
                                <Text style={s.stepValue}>{questionLimit}</Text>
                                <IconButton
                                    onPress={() => stepQuestions(1)}
                                    accessibilityLabel="More questions"
                                    variant="tonal"
                                    icon={(c, size) => <Plus size={size} color={c} weight="bold" />}
                                />
                            </View>
                        </View>

                        <View style={s.divider} />

                        <View style={s.row}>
                            <View style={s.rowText}>
                                <Text style={s.rowTitle}>Include attempted</Text>
                                <Text style={s.rowSub}>
                                    Off means only questions you have never seen.
                                </Text>
                            </View>
                            <Switch
                                value={includeAttempted}
                                onValueChange={setIncludeAttempted}
                                trackColor={{ false: md.color.surfaceContainerHighest, true: md.color.primaryContainer }}
                                thumbColor={includeAttempted ? md.color.primary : md.color.onSurfaceVariant}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom bar */}
            <View style={s.bottomBar}>
                <View style={s.bottomInfo}>
                    <Text style={s.bottomValue}>{finalQuestionCount} questions</Text>
                    <Text style={s.bottomLabel}>about {estimatedTime} min</Text>
                </View>
                <Button
                    label="Generate test"
                    onPress={handleStartTest}
                    disabled={!canGenerate}
                    loading={isGenerating}
                />
            </View>

            {/* Subject picker */}
            <Modal
                visible={subjectPickerOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setSubjectPickerOpen(false)}
            >
                <Pressable style={s.scrim} onPress={() => setSubjectPickerOpen(false)}>
                    <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                        <View style={s.grabber} />
                        <Text style={s.sheetTitle}>Select subject</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {subjects.map((subject) => {
                                const active = subject.id === selectedSubjectId;
                                return (
                                    <Pressable
                                        key={subject.id}
                                        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                                        style={[s.sheetRow, active && s.sheetRowActive]}
                                        onPress={() => {
                                            setSelectedSubjectId(subject.id);
                                            setSubjectPickerOpen(false);
                                        }}
                                    >
                                        <SubjectIcon
                                            name={subject.icon_name as string | undefined}
                                            size={20}
                                            color={active ? md.color.primary : md.color.onSurfaceVariant}
                                        />
                                        <Text style={[s.sheetRowText, active && s.sheetRowTextActive]}>
                                            {subject.name as string}
                                        </Text>
                                        {active && <Check size={16} color={md.color.primary} weight="bold" />}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: md.color.surface },

    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.sm,
        height: 64,
        paddingHorizontal: md.space.sm,
    },
    appBarTitle: { ...md.type.titleLarge, color: md.color.onSurface },

    content: { padding: md.space.lg, paddingBottom: md.space.xxl, gap: md.space.xl },

    warning: {
        padding: md.space.md,
        borderRadius: md.radius.md,
        backgroundColor: md.color.errorContainer,
    },
    warningText: { ...md.type.bodySmall, color: md.color.onErrorContainer },

    section: { gap: md.space.md },
    sectionLabel: { ...md.type.labelSmall, color: md.color.onSurfaceVariant, letterSpacing: 1 },

    select: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.md,
        minHeight: 56,
        paddingHorizontal: md.space.lg,
        borderRadius: md.radius.md,
        borderWidth: 1,
        borderColor: md.color.outlineVariant,
        backgroundColor: md.color.surfaceContainerLow,
        overflow: 'hidden',
    },
    selectValue: { ...md.type.bodyLarge, color: md.color.onSurface, flex: 1 },
    selectPlaceholder: { ...md.type.bodyLarge, color: md.color.onSurfaceVariant, flex: 1 },

    card: {
        borderRadius: md.radius.md,
        backgroundColor: md.color.surfaceContainerLow,
        borderWidth: 1,
        borderColor: md.color.outlineVariant,
        paddingHorizontal: md.space.lg,
        paddingVertical: md.space.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.lg,
        paddingVertical: md.space.md,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { ...md.type.titleSmall, color: md.color.onSurface },
    rowSub: { ...md.type.bodySmall, color: md.color.onSurfaceVariant },
    divider: { height: 1, backgroundColor: md.color.outlineVariant },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: md.space.sm },
    stepValue: {
        ...md.type.titleMedium,
        color: md.color.onSurface,
        minWidth: 28,
        textAlign: 'center',
    },

    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.lg,
        paddingHorizontal: md.space.lg,
        paddingTop: md.space.md,
        paddingBottom: md.space.lg,
        backgroundColor: md.color.surfaceContainer,
        borderTopWidth: 1,
        borderTopColor: md.color.outlineVariant,
    },
    bottomInfo: { flex: 1 },
    bottomValue: { ...md.type.titleSmall, color: md.color.onSurface },
    bottomLabel: { ...md.type.bodySmall, color: md.color.onSurfaceVariant },

    scrim: { flex: 1, backgroundColor: md.color.scrim, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: md.color.surfaceContainer,
        borderTopLeftRadius: md.radius.xl,
        borderTopRightRadius: md.radius.xl,
        paddingHorizontal: md.space.sm,
        paddingBottom: md.space.xl,
        maxHeight: '75%',
    },
    grabber: {
        alignSelf: 'center',
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: md.color.outlineVariant,
        marginTop: md.space.md,
    },
    sheetTitle: {
        ...md.type.titleMedium,
        color: md.color.onSurface,
        paddingHorizontal: md.space.lg,
        paddingVertical: md.space.lg,
    },
    sheetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.lg,
        minHeight: 56,
        paddingHorizontal: md.space.lg,
        borderRadius: md.radius.md,
        overflow: 'hidden',
    },
    sheetRowActive: { backgroundColor: md.color.secondaryContainer },
    sheetRowText: { ...md.type.bodyLarge, color: md.color.onSurface, flex: 1 },
    sheetRowTextActive: { color: md.color.onSecondaryContainer },
});
