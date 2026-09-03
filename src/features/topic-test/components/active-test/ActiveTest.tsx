import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QuestionContent from '@/features/questions/components/QuestionCard/QuestionContent';
import Chip from '@/shared/components/md/Chip';
import ConfirmDialog from '@/shared/components/md/ConfirmDialog';
import { md } from '@/shared/theme/material';
import {
    isMultipleSelection,
    isNumericalQuestion,
} from '@/features/questions/utils/questionUtils';
import useTest from '@/features/topic-test/context/TestSessionProvider';
import QuestionPalette from './QuestionPalette';
import TestControlBar from './TestControlBar';
import TestHeader from './TestHeader';

export default function ActiveTest() {
    const {
        navigation,
        answers,
        timer,
        handleNext,
        handlePrev,
        handleJumpTo,
        handleSubmit,
        questions,
        status,
    } = useTest();

    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [confirmEnd, setConfirmEnd] = useState(false);

    const currentIndex = navigation.currentIndex;
    const totalQuestions = questions?.length || 0;
    const currentQ = questions?.[currentIndex];

    if (!currentQ) return null;

    const currentAttempt = answers.answers.get(currentQ.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === totalQuestions - 1;

    const attemptOrder = questions.findIndex((q) => q.id === currentQ.id) + 1;

    const isMSQ = isMultipleSelection(currentQ);
    const isNAT = isNumericalQuestion(currentQ);

    const msqSelection: number[] =
        isMSQ && Array.isArray(currentAttempt?.user_answer) ? currentAttempt.user_answer : [];

    const mcqSelection: number | null =
        !isMSQ && !isNAT && typeof currentAttempt?.user_answer === 'number'
            ? currentAttempt.user_answer
            : null;

    const rawVal = currentAttempt?.user_answer;
    const natValue = typeof rawVal === 'number' ? String(rawVal) : '';

    const handleOptionClick = (optionIndex: number) => {
        if (isMSQ) {
            const currentArr = Array.isArray(currentAttempt?.user_answer)
                ? [...currentAttempt.user_answer]
                : [];
            const existsAt = currentArr.indexOf(optionIndex);
            if (existsAt > -1) currentArr.splice(existsAt, 1);
            else currentArr.push(optionIndex);
            currentArr.sort((a, b) => a - b);
            answers.selectOption(currentQ.id, currentArr, attemptOrder);
        } else {
            answers.selectOption(currentQ.id, optionIndex, attemptOrder);
        }
    };

    const handleNumericalChange = (value: string) => {
        const parsed = value.trim() === '' ? null : Number(value);
        answers.selectOption(
            currentQ.id,
            parsed !== null && Number.isNaN(parsed) ? null : parsed,
            attemptOrder
        );
    };

    const allAttempts = Array.from(answers.answers.values());
    const answeredCount = allAttempts.filter((a) => a.status === 'answered').length;
    const markedCount = allAttempts.filter((a) => a.marked_for_review).length;
    const visitedNotAnswered = allAttempts.filter((a) => a.status === 'viewed').length;
    const unvisitedCount = Math.max(0, questions.length - (answeredCount + visitedNotAnswered));

    const unanswered = questions.length - answeredCount;

    return (
        <View style={s.root}>
            <TestHeader
                timeDisplay={timer.timeDisplay}
                questionStatus={`Question ${currentIndex + 1} of ${totalQuestions}`}
                lowTime={timer.secondsRemaining <= 120}
                onEndTest={() => setConfirmEnd(true)}
            />

            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.marksRow}>
                    <Chip
                        label={`+${currentQ.marks} mark${currentQ.marks > 1 ? 's' : ''}`}
                        tone={{ bg: md.color.secondaryContainer, fg: md.color.onSecondaryContainer }}
                    />
                    {!isMSQ && !isNAT && (
                        <Chip
                            label={`−${(currentQ.marks / 3).toFixed(2)} if wrong`}
                            tone={{ bg: md.color.errorContainer, fg: md.color.onErrorContainer }}
                        />
                    )}
                </View>

                <QuestionContent
                    env="Test"
                    currentQuestion={currentQ}
                    hasOptions={!isNAT}
                    showAnswer={false}
                    selectedOptionIndices={msqSelection}
                    userAnswerIndex={mcqSelection}
                    onOptionSelect={handleOptionClick}
                />

                {isNAT && (
                    <View style={s.natBox}>
                        <Text style={s.natLabel}>Your numerical answer</Text>
                        <TextInput
                            value={natValue}
                            onChangeText={handleNumericalChange}
                            keyboardType="numeric"
                            placeholder="Enter value…"
                            placeholderTextColor="#475569"
                            style={s.natInput}
                        />
                    </View>
                )}

                {status === 'submitting' && <Text style={s.submitting}>Submitting your test…</Text>}
            </ScrollView>

            <TestControlBar
                isFirst={isFirst}
                isLast={isLast}
                isReviewMarked={answers.isMarkedForReview(currentQ.id)}
                onNext={handleNext}
                onPrev={handlePrev}
                onMarkForReview={() => answers.toggleReview(currentQ.id, attemptOrder)}
                onClearResponse={() => answers.selectOption(currentQ.id, null, attemptOrder)}
                onTogglePalette={() => setIsPaletteOpen(true)}
            />

            <ConfirmDialog
                visible={confirmEnd}
                title="Submit test?"
                message={
                    unanswered > 0
                        ? `${unanswered} question${unanswered === 1 ? '' : 's'} left unanswered. This cannot be undone.`
                        : 'This cannot be undone.'
                }
                confirmLabel="Submit"
                cancelLabel="Keep going"
                destructive
                onCancel={() => setConfirmEnd(false)}
                onConfirm={() => {
                    setConfirmEnd(false);
                    handleSubmit();
                }}
            />

            <QuestionPalette
                questions={questions}
                currentIndex={currentIndex}
                isOpen={isPaletteOpen}
                onToggle={() => setIsPaletteOpen(false)}
                onJumpTo={handleJumpTo}
                markedForReview={answers.isMarkedForReview}
                isAnswered={answers.isAnswered}
                isVisited={answers.isVisited}
                answeredCount={answeredCount}
                markedCount={markedCount}
                visitedNotAnswered={visitedNotAnswered}
                unvisitedCount={unvisitedCount}
            />
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: md.color.surface },
    scroll: { flex: 1 },
    content: { padding: md.space.lg, paddingBottom: md.space.xl },
    marksRow: { flexDirection: 'row', gap: md.space.sm, marginBottom: md.space.lg },
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
    submitting: {
        ...md.type.bodyMedium,
        color: md.color.onSurfaceVariant,
        textAlign: 'center',
        marginTop: md.space.xl,
    },
});
