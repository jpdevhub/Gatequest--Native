// Encapsulates the reveal-and-record flow for one question.
import React from 'react';
import { submitAndRecordAnswer } from '@/features/questions/utils/answerHandler';
import { useGoals } from '@/providers/GoalProvider';
import { useStats } from '@/providers/StatsProvider';
import type { AppUser } from '@/shared/types/AppUser';
import type { Question } from '@/shared/types/storage';

type UseAnswerFlowProps = {
    currentQuestion: Question;
    selectedOptionIndices: number[] | null;
    numericalAnswer: number | null;
    timeTaken: number;
    user: AppUser | null;
    isLogin: boolean;
    setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;
    setResult: React.Dispatch<React.SetStateAction<'correct' | 'incorrect' | 'unattempted'>>;
    stop: () => void;
    showAnswer: boolean;
};

export default function useAnswerFlow({
    currentQuestion,
    selectedOptionIndices,
    numericalAnswer,
    timeTaken,
    user,
    isLogin,
    setShowAnswer,
    setResult,
    stop,
    showAnswer,
}: UseAnswerFlowProps) {
    const { updateStats } = useStats();
    const { userGoal } = useGoals();

    const handleShowAnswer = async () => {
        if (!currentQuestion || showAnswer) return;

        stop?.();
        setShowAnswer(true);

        const resultStatus = await submitAndRecordAnswer({
            currentQuestion,
            selectedOptionIndices,
            numericalAnswer,
            timeTaken,
            user,
            isLogin,
            refresh: () => {
                void updateStats();
            },
            branchId: userGoal?.branch_id,
        });

        setResult(resultStatus);
    };

    const handleSubmit = async () => {
        await handleShowAnswer();
    };

    return { handleShowAnswer, handleSubmit };
}
