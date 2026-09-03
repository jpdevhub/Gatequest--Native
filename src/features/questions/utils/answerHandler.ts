import { toast } from 'sonner-native';
import type { AppUser } from '@/shared/types/AppUser';
import type { NumericalAnswerSpec, Question } from '@/shared/types/storage';
import { emitAppEvent } from '@/shared/utils/appEvents';
import { recordAttemptLocally } from '@/shared/utils/helper';
import { isNumericalQuestion } from './questionUtils';

type SubmitAndRecordAnswerProps = {
    currentQuestion: Question;
    selectedOptionIndices: number[] | null;
    numericalAnswer: number | null;
    timeTaken: number;
    user: AppUser | null;
    isLogin: boolean;
    refresh: () => void;
    branchId?: string | undefined;
};

const isNumericalAnswerCorrect = (userAnswer: number, spec: NumericalAnswerSpec): boolean => {
    switch (spec.type) {
        case 'exact':
            return userAnswer === spec.value;
        case 'multiple':
            return spec.values.includes(userAnswer);
        case 'range':
            return spec.inclusive !== false
                ? userAnswer >= spec.min && userAnswer <= spec.max
                : userAnswer > spec.min && userAnswer < spec.max;
        case 'tolerance':
            return Math.abs(userAnswer - spec.value) <= spec.tolerance;
    }
};

const arraysMatch = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) => x - y);
    const sortedB = [...b].sort((x, y) => x - y);
    return sortedA.every((val, index) => val === sortedB[index]);
};

export const submitAndRecordAnswer = async ({
    currentQuestion,
    selectedOptionIndices,
    numericalAnswer,
    timeTaken,
    user,
    isLogin,
    refresh,
    branchId,
}: SubmitAndRecordAnswerProps): Promise<'correct' | 'incorrect' | 'unattempted'> => {
    let isCorrect: boolean | null = null;

    if (!branchId) return 'unattempted';

    const wasAttempted = selectedOptionIndices
        ? selectedOptionIndices.length > 0 || isNumericalQuestion(currentQuestion)
        : false;

    if (wasAttempted) {
        if (isNumericalQuestion(currentQuestion)) {
            if (numericalAnswer !== null && !Number.isNaN(numericalAnswer)) {
                isCorrect = isNumericalAnswerCorrect(
                    numericalAnswer,
                    currentQuestion.correct_answer
                );
            }
        } else {
            isCorrect = arraysMatch(
                selectedOptionIndices!,
                currentQuestion.correct_answer as number[]
            );
        }
    }

    if (isLogin && user && user.id !== '1') {
        try {
            await recordAttemptLocally({
                params: {
                    user_id: user.id,
                    question_id: currentQuestion.id,
                    subject: currentQuestion.subject,
                    subject_id: currentQuestion.subject_id,
                    branch_id: branchId,
                    was_correct: isCorrect,
                    time_taken: timeTaken,
                    attempt_number: 1,
                    user_version_number: user.version_number,
                },
                user,
                refresh,
            });

            emitAppEvent('STATS_UPDATED');
        } catch (error) {
            console.error('Failed to record attempt:', error);
            toast.error('Could not save your attempt.');
        }
    }

    if (isCorrect === true) return 'correct';
    if (isCorrect === false) return 'incorrect';
    return 'unattempted';
};
