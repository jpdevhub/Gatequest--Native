/**
 * useQuestionController — port of the PWA controller.
 *
 * The PWA changes route on every next/prev and passes the question list through
 * router state. Expo Router has no route state, and re-mounting a screen per
 * question would be slow, so navigation happens inside this hook and the route
 * param only seeds the starting question.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { toast } from 'sonner-native';
import useAnswerFlow from '@/features/questions/hooks/useAnswerFlow';
import { usePeerBenchmark } from '@/features/questions/hooks/usePeerBenchmark';
import { useQuestionState } from '@/features/questions/hooks/useQuestionState';
import { useQuestionTimer } from '@/features/questions/hooks/useQuestionTimer';
import { useAppSettings } from '@/providers/AppSettingsProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { Question } from '@/shared/types/storage';
import { storage } from '@/shared/utils/storageService';
import { handleReport } from './questions';

const SESSION_KEY = 'gatequest_last_active_session';
const SESSION_TS_KEY = 'gatequest_last_active_timestamp';

interface UseQuestionControllerProps {
    questions: Question[];
    mode: 'practice' | 'revision';
    subjectSlug?: string | undefined;
    revisionId?: string | undefined;
    qid?: string | undefined;
    onBack: () => void;
}

export const useQuestionController = ({
    questions,
    mode,
    subjectSlug,
    revisionId,
    qid,
    onBack,
}: UseQuestionControllerProps) => {
    const { user, isLogin } = useAuth();
    const { settings } = useAppSettings();

    const [currentIndex, setCurrentIndex] = useState<string | number>(qid || 0);

    const currentQuestion = useMemo(() => {
        if (!questions || questions.length === 0) return null;
        return (
            questions.find((q) => String(q.id) === String(currentIndex)) || questions[0] || null
        );
    }, [questions, currentIndex]);

    const safeQuestion = useMemo(
        () =>
            currentQuestion ||
            ({ id: '0', options: [], correct_answer: [], subject: '', subject_id: '' } as unknown as Question),
        [currentQuestion]
    );

    const {
        userAnswerIndex,
        selectedOptionIndices,
        numericalAnswer,
        numericalText,
        showAnswer,
        setShowAnswer,
        result,
        setResult,
        resetState,
        handleOptionSelect,
        handleNumericalInputChange,
    } = useQuestionState(safeQuestion);

    const {
        time: timeTaken,
        minutes,
        seconds,
        isActive: isTimerActive,
        toggle: toggleTimer,
        stop: stopTimer,
    } = useQuestionTimer(settings?.autoTimer, safeQuestion, showAnswer);

    const { handleShowAnswer, handleSubmit } = useAnswerFlow({
        currentQuestion: safeQuestion,
        selectedOptionIndices,
        numericalAnswer,
        timeTaken,
        user,
        isLogin,
        setShowAnswer,
        setResult,
        stop: stopTimer,
        showAnswer,
    });

    const index = useMemo(
        () => questions.findIndex((q) => String(q.id) === String(safeQuestion.id)),
        [questions, safeQuestion.id]
    );

    const isFirst = index <= 0;
    const isLast = index === questions.length - 1;

    const goto = useCallback(
        (nextIdx: number) => {
            const nextQ = questions[nextIdx];
            if (!nextQ) return;
            setCurrentIndex(String(nextQ.id));
            resetState();
        },
        [questions, resetState]
    );

    const handleNext = useCallback(() => {
        if (index < questions.length - 1) goto(index + 1);
    }, [index, questions.length, goto]);

    const handlePrevious = useCallback(() => {
        if (index > 0) goto(index - 1);
    }, [index, goto]);

    const {
        benchmarkDetails,
        loading: statsLoading,
        message: statsMessage,
    } = usePeerBenchmark(safeQuestion.id);

    // Feeds the dashboard's "continue where you left off" widget.
    useEffect(() => {
        if (!currentQuestion) return;
        const path =
            mode === 'practice'
                ? `/practice/${subjectSlug}/${currentQuestion.id}`
                : `/revision/${revisionId}/${currentQuestion.id}`;
        storage.set(SESSION_KEY, path);
        storage.set(SESSION_TS_KEY, Date.now());
    }, [currentQuestion, mode, subjectSlug, revisionId]);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const handleReportSubmit = async (reportType: string, reportText: string) => {
        if (!user?.id) {
            toast.error('You must be logged in to report a question.');
            return;
        }

        setReportSubmitting(true);
        try {
            const { error } = await handleReport({
                user_id: user.id,
                question_id: safeQuestion.id,
                report_type: reportType,
                report_text: reportText,
            });

            if (error) {
                if (error.code === '23505') toast.error('Already reported by you.');
                else toast.error('Error submitting report.');
            } else {
                toast.success('Thank you for the report!');
                setShowReportModal(false);
            }
        } catch (err) {
            console.error(err);
            toast.error('Error submitting report.');
        } finally {
            setReportSubmitting(false);
        }
    };

    const onShareClick = async () => {
        try {
            await Share.share({
                message: `GATEQuest — ${safeQuestion.subject} (${safeQuestion.year})\n${
                    safeQuestion.source_url || 'https://gatequest.in'
                }`,
            });
        } catch (err) {
            console.error('[share] failed', err);
        }
    };

    const onExplanationClick = async () => {
        const url = mode === 'practice' ? safeQuestion.source_url : safeQuestion.explanation;
        if (!url) {
            toast.info('No external explanation is linked for this question.');
            return;
        }
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch (err) {
            console.error('[explanation] failed to open', err);
        }
    };

    return {
        currentQuestion,
        isLoading: !currentQuestion,
        cardProps: {
            question: currentQuestion!,
            totalQuestions: questions.length,
            questionNumber: index + 1,
            subjectSlug,
            userAnswerIndex,
            selectedOptionIndices,
            numericalAnswer,
            numericalText,
            showAnswer,
            result,
            timer: { minutes, seconds, isActive: isTimerActive, onToggle: toggleTimer },
            peerStats: {
                loading: statsLoading,
                message: statsMessage,
                data: benchmarkDetails,
            },
            onOptionSelect: handleOptionSelect,
            onNumericalChange: handleNumericalInputChange,
            onShowAnswer: handleShowAnswer,
            handleSubmit,
            onNext: handleNext,
            onPrev: handlePrevious,
            onReport: () => setShowReportModal(true),
            onShare: onShareClick,
            onExplanationClick,
            onBack,
            isFirst,
            isLast,
        },
        modalProps: {
            questionId: safeQuestion.id,
            show: showReportModal,
            onClose: () => setShowReportModal(false),
            onSubmit: handleReportSubmit,
            reportSubmitting,
        },
    };
};
