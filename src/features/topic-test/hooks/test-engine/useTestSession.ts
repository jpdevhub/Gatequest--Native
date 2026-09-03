/**
 * useTestSession — port of the PWA test engine.
 *
 * Differences from the PWA: navigation on submit is delegated to the caller
 * (Expo Router has no `navigate` from a hook context here), and the browser
 * `window.setInterval` becomes React Native's `setInterval`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getPendingAttempts,
    getTestSession,
    markAttemptsSynced,
    updateSessionTimeAndStatus,
} from '@/features/topic-test/services/testSession';
import type { Question } from '@/shared/types/storage';
import { updateTestTime, upsertAttempts } from '../../api/topicTest';
import useTestAnswer from './useTestAnswer';
import useTestGrading from './useTestGrading';
import type { TestData } from './useTestLoader';
import useTestNavigation from './useTestNavigation';
import useTestTimer from './useTestTimer';

const HEARTBEAT_MS = 60_000;

export interface UseTestSessionReturn {
    status: 'ready' | 'error' | 'submitting' | 'completed';
    timer: ReturnType<typeof useTestTimer>;
    navigation: ReturnType<typeof useTestNavigation>;
    answers: ReturnType<typeof useTestAnswer>;
    questions: Question[];
    handleNext: () => void;
    handlePrev: () => void;
    handleJumpTo: (index: number) => void;
    handleSubmit: () => void;
}

const useTestSession = (
    testId: string,
    data: TestData,
    onFinished: (testId: string) => void
): UseTestSessionReturn => {
    const [status, setStatus] = useState<'ready' | 'error' | 'submitting' | 'completed'>('ready');

    // Set on mount; reading the clock during render is not idempotent.
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        startTimeRef.current = Date.now();
    }, []);

    const answers = useTestAnswer({ testId, initialAttempts: data.attempts });
    const navigation = useTestNavigation(data.questions.length);
    const timer = useTestTimer({ initialSeconds: data.session.remaining_time_seconds });
    const grading = useTestGrading();

    const timerRef = useRef<number>(timer.secondsRemaining);
    const onFinishedRef = useRef(onFinished);
    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    const commitCurrentTime = useCallback(() => {
        const question = data.questions[navigation.currentIndex];
        if (!question) return;

        const deltaSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const attemptOrder = data.questions.findIndex((q) => q.id === question.id) + 1;
        answers.updateTimeSpent(question.id, deltaSeconds, attemptOrder);
        startTimeRef.current = Date.now();
    }, [answers, navigation.currentIndex, data.questions]);

    const handleNext = useCallback(() => {
        commitCurrentTime();
        navigation.next();
    }, [navigation, commitCurrentTime]);

    const handlePrev = useCallback(() => {
        commitCurrentTime();
        navigation.prev();
    }, [navigation, commitCurrentTime]);

    const handleJumpTo = useCallback(
        (index: number) => {
            commitCurrentTime();
            navigation.jumpTo(index);
        },
        [navigation, commitCurrentTime]
    );

    const { currentIndex } = navigation;
    useEffect(() => {
        const question = data.questions[currentIndex];
        if (!question) return;
        const realIndex = data.questions.findIndex((q) => q.id === question.id);
        answers.markAsVisited(question.id, realIndex !== -1 ? realIndex + 1 : currentIndex + 1);
    }, [currentIndex, data.questions, answers]);

    const handleSubmit = useCallback(async () => {
        setStatus('submitting');

        try {
            commitCurrentTime();

            const testSession = await getTestSession(testId);
            if (testSession?.session?.status === 'completed') {
                onFinishedRef.current(testId);
                return;
            }

            await grading.submitTest(testId);
            setStatus('completed');
            onFinishedRef.current(testId);
        } catch (err) {
            console.error('Error in handleSubmit: ', err);
            setStatus('error');
        }
    }, [commitCurrentTime, grading, testId]);

    // Heartbeat: push remaining time and unsynced attempts to Supabase.
    useEffect(() => {
        if (status === 'completed') return;

        let cancelled = false;

        const heartbeat = async () => {
            if (!testId) return;

            try {
                await updateTestTime(testId, timerRef.current);

                const dirtyAttempts = await getPendingAttempts();
                if (dirtyAttempts.length === 0) return;

                const payload = dirtyAttempts.map((a) => {
                    const realIndex = data.questions.findIndex((q) => q.id === a.question_id);
                    return {
                        session_id: a.session_id,
                        question_id: a.question_id,
                        attempt_order: realIndex !== -1 ? realIndex + 1 : a.attempt_order,
                        user_answer: a.user_answer ?? null,
                        marked_for_review: a.marked_for_review ?? false,
                        status: a.status ?? 'unvisited',
                        score: a.score ?? 0,
                        time_spent_seconds: a.time_spent_seconds,
                    };
                });

                const { error } = await upsertAttempts(payload);
                if (!error) await markAttemptsSynced(dirtyAttempts);
                else console.error('Heartbeat upsert error:', error);
            } catch (err) {
                console.error('Heartbeat failed:', err);
            }
        };

        void heartbeat();
        const interval = setInterval(() => {
            if (!cancelled) void heartbeat();
        }, HEARTBEAT_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [testId, status, data.questions]);

    useEffect(() => {
        if (timer.isExpired && status !== 'completed' && status !== 'submitting') {
            void handleSubmit();
        }
    }, [timer.isExpired, status, handleSubmit]);

    // Persist the countdown locally so a cold restart resumes at the right time.
    useEffect(() => {
        if (status !== 'ready' && status !== 'submitting') return;

        timerRef.current = timer.secondsRemaining;
        if (timer.secondsRemaining % 5 === 0) {
            void updateSessionTimeAndStatus(testId, timer.secondsRemaining, status);
        }
    }, [timer.secondsRemaining, testId, status]);

    useEffect(
        () => () => {
            void updateSessionTimeAndStatus(testId, timerRef.current, 'paused');
        },
        [testId]
    );

    return {
        questions: data.questions,
        handleNext,
        handlePrev,
        handleJumpTo,
        handleSubmit,
        status,
        timer,
        navigation,
        answers,
    };
};

export default useTestSession;
