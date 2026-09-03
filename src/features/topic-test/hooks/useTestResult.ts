/**
 * useTestResult — port of the PWA's TopicReviewLayout loader.
 * Serves the completed session and its graded attempts (with questions attached),
 * from the local store when possible and Supabase otherwise.
 */
import { useEffect, useState } from 'react';
import {
    getTestSession,
    initializeTestSession,
} from '@/features/topic-test/services/testSession';
import type { Attempt, Question, TestSession } from '@/shared/types/storage';
import { fetchAttemptsWithQuestions, fetchTestById } from '../api/topicTest';

export type AttemptWithQuestion = Attempt & { questions: Question };

export default function useTestResult(testId: string | undefined) {
    const [session, setSession] = useState<TestSession | null>(null);
    const [attempts, setAttempts] = useState<AttemptWithQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notCompleted, setNotCompleted] = useState(false);

    useEffect(() => {
        if (!testId) return;
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const localData = await getTestSession(testId);

                const hasAllQuestions = localData?.attempts?.every((attempt) =>
                    localData.questions.some((q) => q.id === attempt.question_id)
                );

                if (
                    localData?.session?.status === 'completed' &&
                    localData.attempts.length > 0 &&
                    hasAllQuestions
                ) {
                    const mapped = localData.attempts.map((attempt) => ({
                        ...attempt,
                        questions: localData.questions.find(
                            (q) => q.id === attempt.question_id
                        ) as Question,
                    }));

                    if (isMounted) {
                        setSession(localData.session);
                        setAttempts(mapped);
                        setLoading(false);
                    }
                    return;
                }

                const { data: sessionData, error: sessionError } = await fetchTestById(testId);
                if (sessionError || !sessionData) throw new Error('Test not found.');

                const remoteSession = sessionData as unknown as TestSession;

                if (remoteSession.status !== 'completed') {
                    if (isMounted) {
                        setNotCompleted(true);
                        setLoading(false);
                    }
                    return;
                }

                const { data: attemptsData, error: attemptsError } =
                    await fetchAttemptsWithQuestions(testId);
                if (attemptsError) throw attemptsError;

                const rows = (attemptsData ?? []) as unknown as AttemptWithQuestion[];

                const questionsToCache = rows
                    .flatMap((a) => (Array.isArray(a.questions) ? a.questions : [a.questions]))
                    .filter((q): q is Question => !!q);

                const pureAttempts = rows.map(({ questions: _q, ...rest }) => rest as Attempt);

                await initializeTestSession(remoteSession, pureAttempts, questionsToCache);

                if (isMounted) {
                    setSession(remoteSession);
                    setAttempts(rows);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load test results.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void load();
        return () => {
            isMounted = false;
        };
    }, [testId]);

    return { session, attempts, loading, error, notCompleted };
}
