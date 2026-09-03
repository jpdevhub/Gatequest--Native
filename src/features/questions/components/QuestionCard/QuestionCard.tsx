import { ArrowLeft, ShareNetwork, Warning } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSettings } from '@/providers/AppSettingsProvider';
import { useGoals } from '@/providers/GoalProvider';
import type { AIProvider } from '@/shared/types/Settings';
import type { Question } from '@/shared/types/storage';
import IconButton from '@/shared/components/md/IconButton';
import { md } from '@/shared/theme/material';
import { openInAI } from '@/shared/utils/aiPromptUtils';
import type { Benchmark } from '../../api/questions';
import { getCorrectAnswerText, isNumericalQuestion } from '../../utils/questionUtils';
import ActionButtons from './ActionButtons';
import AskAIBanner from './AskAIBanner';
import QuestionBadge from './QuestionBadge';
import QuestionContent from './QuestionContent';
import QuestionExplanation from './QuestionExplanation';
import QuestionHeader from './QuestionHeader';
import QuestionPeerStats from './QuestionPeerStats';
import ResultMessage from './ResultMessage';

type TimerProps = { minutes: string; seconds: string; isActive: boolean; onToggle: () => void };
type PeerStatsProps = { loading: boolean; message: string | null; data: Benchmark | null };

export type QuestionCardProps = {
    question: Question;
    totalQuestions: number;
    questionNumber: number;
    subjectSlug: string | undefined;

    userAnswerIndex: number | null;
    selectedOptionIndices: number[];
    numericalAnswer: number | null;
    numericalText?: string;
    marked?: boolean;

    showAnswer: boolean;
    result: 'correct' | 'incorrect' | 'unattempted';

    timer?: TimerProps | undefined;
    peerStats?: PeerStatsProps | undefined;

    onOptionSelect?: ((index: number) => void) | undefined;
    onNumericalChange?: ((value: string) => void) | undefined;
    onShowAnswer?: (() => void) | undefined;
    handleSubmit?: (() => void) | undefined;
    onNext: () => void;
    onPrev: () => void;
    onReport: () => void;
    onShare: () => void;
    onExplanationClick: () => void;
    onBack: () => void;

    isFirst: boolean;
    isLast: boolean;
};

export default function QuestionCard({
    question,
    totalQuestions,
    questionNumber,
    subjectSlug,
    userAnswerIndex,
    selectedOptionIndices,
    numericalAnswer,
    numericalText,
    marked,
    showAnswer,
    result,
    timer,
    peerStats,
    onOptionSelect,
    onNumericalChange,
    onShowAnswer,
    handleSubmit,
    onNext,
    onPrev,
    onReport,
    onShare,
    onExplanationClick,
    onBack,
    isFirst,
    isLast,
}: QuestionCardProps) {
    const { isSubjectInGoal } = useGoals();
    const { settings } = useAppSettings();
    const scrollRef = useRef<ScrollView>(null);

    const aiProvider = (settings.aiProvider ?? 'chatgpt') as AIProvider;

    const hasOptions = !!(
        question.options &&
        Array.isArray(question.options) &&
        question.options.length > 0
    );
    const correctAnswerText = getCorrectAnswerText(question);
    const isCompatible = isSubjectInGoal(question.subject_id);
    const hasSelection = selectedOptionIndices.length > 0 || numericalAnswer !== null;

    // Every question starts from the top, exactly like the PWA.
    useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [question.id]);

    const handleAskAI = (doubt?: string) => {
        void openInAI(question, aiProvider, settings.aiCustomPrompt ?? '', doubt);
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <View style={s.appBar}>
                <IconButton
                    onPress={onBack}
                    accessibilityLabel="Back"
                    icon={(c, size) => <ArrowLeft size={size} color={c} weight="bold" />}
                />
                <Text style={s.appBarTitle} numberOfLines={1}>
                    {question.subject}
                </Text>
                <IconButton
                    onPress={onReport}
                    accessibilityLabel="Report this question"
                    icon={(c, size) => <Warning size={size} color={c} />}
                />
                <IconButton
                    onPress={onShare}
                    accessibilityLabel="Share"
                    icon={(c, size) => <ShareNetwork size={size} color={c} />}
                />
            </View>

            <ScrollView
                ref={scrollRef}
                style={s.scroll}
                contentContainerStyle={s.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {isCompatible === false && (
                    <View style={s.warning}>
                        <Text style={s.warningTitle}>Branch mismatch</Text>
                        <Text style={s.warningText}>
                            This question belongs to a different branch. You can view it, but
                            answering is disabled to protect your current branch progress.
                        </Text>
                    </View>
                )}

                <QuestionHeader
                    questionNumber={questionNumber}
                    totalQuestions={totalQuestions}
                    question={question}
                    subjectSlug={subjectSlug}
                    timer={timer}
                    marked={marked}
                    isAnswered={showAnswer}
                />

                <View style={s.bodyWrap}>
                    <QuestionContent
                        env="Practice"
                        currentQuestion={question}
                        hasOptions={hasOptions}
                        showAnswer={showAnswer}
                        selectedOptionIndices={selectedOptionIndices}
                        userAnswerIndex={userAnswerIndex}
                        onOptionSelect={onOptionSelect}
                    />

                    {isNumericalQuestion(question) && onNumericalChange && (
                        <View style={s.natBox}>
                            <Text style={s.natLabel}>Enter your numerical answer</Text>
                            <TextInput
                                value={numericalText ?? (numericalAnswer?.toString() ?? '')}
                                onChangeText={onNumericalChange}
                                keyboardType="numeric"
                                editable={!showAnswer}
                                placeholder="Enter your answer"
                                placeholderTextColor="#475569"
                                style={[s.natInput, showAnswer && s.natInputDisabled]}
                                onSubmitEditing={() => onShowAnswer?.()}
                            />
                            {showAnswer && (
                                <Text style={s.natCorrect}>Correct answer: {correctAnswerText}</Text>
                            )}
                        </View>
                    )}

                    {showAnswer && (
                        <Animated.View entering={FadeIn.duration(220)}>
                            <ResultMessage
                                numericalAnswer={numericalAnswer}
                                showAnswer={showAnswer}
                                result={result}
                                currentQuestion={question}
                            />

                            {peerStats && (
                                <QuestionPeerStats
                                    loading={peerStats.loading}
                                    message={peerStats.message}
                                    data={peerStats.data}
                                />
                            )}

                            <QuestionExplanation question={question} />

                            <AskAIBanner provider={aiProvider} onPress={handleAskAI} />
                        </Animated.View>
                    )}

                    <QuestionBadge currentQuestion={question} />
                </View>
            </ScrollView>

            <ActionButtons
                isFirstQuestion={isFirst}
                isLastQuestion={isLast}
                handleNext={onNext}
                handlePrevious={onPrev}
                showAnswer={showAnswer}
                handleShowAnswer={onShowAnswer}
                handleSubmit={handleSubmit}
                handleExplanationClick={onExplanationClick}
                isCompatible={isCompatible}
                hasSelection={hasSelection}
            />
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
    appBarTitle: { ...md.type.titleMedium, color: md.color.onSurface, flex: 1, marginLeft: md.space.xs },
    scroll: { flex: 1 },
    content: { paddingHorizontal: md.space.lg, paddingBottom: md.space.xl },
    bodyWrap: { paddingTop: md.space.lg },
    warning: {
        backgroundColor: md.color.warningContainer,
        padding: md.space.lg,
        borderRadius: md.radius.md,
        marginBottom: md.space.lg,
        gap: md.space.xs,
    },
    warningTitle: { ...md.type.titleSmall, color: md.color.onWarningContainer },
    warningText: { ...md.type.bodySmall, color: md.color.onWarningContainer },
    natBox: { marginTop: md.space.xl, gap: md.space.sm },
    natLabel: { ...md.type.titleSmall, color: md.color.onSurface },
    natInput: {
        borderWidth: 1,
        borderColor: md.color.outlineVariant,
        backgroundColor: md.color.surfaceContainerLow,
        borderRadius: md.radius.sm,
        paddingHorizontal: md.space.lg,
        paddingVertical: md.space.md + 2,
        color: md.color.onSurface,
        fontSize: 16,
        minHeight: 56,
    },
    natInputDisabled: { opacity: 0.6 },
    natCorrect: { ...md.type.bodyMedium, color: md.color.success },
});
