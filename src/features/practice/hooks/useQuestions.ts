/**
 * useQuestions — port of the PWA hook.
 *
 * Local cache first so a subject opens instantly and works offline, then a delta
 * sync against Supabase (at most once an hour per subject) using `updated_at`.
 */
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner-native';
import { useGoals } from '@/providers/GoalProvider';
import {
    bulkUpsertQuestions,
    getQuestionsBySubject,
    getSubjectSyncMetadata,
    updateSubjectSyncMetadata,
} from '@/shared/storage/questionRepository';
import type { Question } from '@/shared/types/storage';
import { sortQuestionsByYear } from '@/shared/utils/helper';
import { supabase } from '@/shared/utils/supabaseClient';

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

const isQuestionInActiveExams = (q: Question, activeExams: string[]) => {
    const examData = q.metadata?.exam as string | string[] | undefined;
    if (!examData) return false;

    const normalizedActive = activeExams.map((e) => e.toUpperCase());

    if (Array.isArray(examData)) {
        return examData.some((e) => normalizedActive.includes(e.toUpperCase()));
    }
    return normalizedActive.includes(examData.toUpperCase());
};

const getLatestTimestamp = (questions: Question[], currentMax: string | undefined) => {
    if (!questions.length) return currentMax;
    let max = currentMax || '';
    questions.forEach((q) => {
        if (q.updated_at && q.updated_at > max) max = q.updated_at;
    });
    return max;
};

const fetchQuestionsBySubject = async (
    subjectId: string | undefined,
    lastFetchedAt: string | undefined
): Promise<Question[]> => {
    if (!subjectId) return [];

    let query = supabase.from('questions').select('*').eq('subject_id', subjectId).eq('verified', true);
    if (lastFetchedAt) query = query.gt('updated_at', lastFetchedAt);

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching questions: ', error.message);
        throw error;
    }
    return (data ?? []) as unknown as Question[];
};

const useQuestions = (subjectId: string | undefined) => {
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { userGoal } = useGoals();

    const filteredQuestions = useMemo(() => {
        const activeExams = (userGoal?.target_exams as string[]) || [];
        return allQuestions.filter((q) => isQuestionInActiveExams(q, activeExams));
    }, [allQuestions, userGoal?.target_exams]);

    useEffect(() => {
        if (!subjectId) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError('');

            try {
                const localData = getQuestionsBySubject(subjectId);
                if (isMounted) {
                    setAllQuestions(sortQuestionsByYear(localData));
                    if (localData.length > 0) setIsLoading(false);
                }

                const syncMeta = getSubjectSyncMetadata(subjectId);
                const lastFetched = syncMeta?.last_fetched_at;
                const lastSynced = syncMeta?.last_sync;

                // An empty cache always re-syncs. Otherwise a fetch that returned
                // nothing (offline, or a subject not yet seeded) would stamp
                // last_sync and leave the subject looking empty for a whole hour.
                const shouldSync =
                    !lastSynced ||
                    localData.length === 0 ||
                    Date.now() - Number(lastSynced) >= SYNC_INTERVAL_MS;

                if (!shouldSync) return;

                const remoteUpdates = await fetchQuestionsBySubject(subjectId, lastFetched);
                updateSubjectSyncMetadata(subjectId);

                if (remoteUpdates.length > 0) {
                    bulkUpsertQuestions(remoteUpdates);
                    const newMaxTime = getLatestTimestamp(remoteUpdates, lastFetched);
                    if (newMaxTime) updateSubjectSyncMetadata(subjectId, newMaxTime);

                    if (isMounted) {
                        setAllQuestions(sortQuestionsByYear(getQuestionsBySubject(subjectId)));
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : String(err));
                    // Cached questions still render, so this is only a warning.
                    if (getQuestionsBySubject(subjectId).length === 0) {
                        toast.error('Could not load questions. Check your connection.');
                    }
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchData();

        return () => {
            isMounted = false;
        };
    }, [subjectId]);

    return { questions: filteredQuestions, isLoading, error };
};

export default useQuestions;
