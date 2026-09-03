/**
 * useSmartRevision — port of the PWA hook.
 * The active weekly set is cached locally so the question screen can be resumed
 * (and read offline) without re-calling the RPC.
 */
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner-native';
import { useGoals } from '@/providers/GoalProvider';
import { readDoc, writeDoc } from '@/shared/storage/appStorage';
import type { RevisionQuestion } from '@/shared/types/storage';
import { emitAppEvent } from '@/shared/utils/appEvents';
import { getUserProfile } from '@/shared/utils/helper';
import {
    fetchCriticalQuestionCount,
    fetchWeeklySet,
    generateWeeklySet,
    startWeeklySet,
    type WeeklySet,
} from '../api/smartRevision';

const WEEKLY_SET_DOC = 'weekly_set_info';

export const getCachedWeeklySet = (): WeeklySet | null =>
    readDoc<WeeklySet | null>(WEEKLY_SET_DOC, null);

const useSmartRevision = () => {
    const user = getUserProfile();
    const userId = user?.id;

    const { userGoal, getPracticeSubjects } = useGoals();
    const branchId = userGoal?.branch_id;
    const targetExams = userGoal?.target_exams as string[] | undefined;

    const [loading, setLoading] = useState<boolean>(true);
    const [currentSet, setCurrentSet] = useState<WeeklySet | null>(() => getCachedWeeklySet());
    const [questions, setQuestions] = useState<RevisionQuestion[]>(
        () => getCachedWeeklySet()?.questions ?? []
    );
    const [criticalQuestionsCount, setCriticalQuestionsCount] = useState(0);

    const fetchCurrentSet = useCallback(async () => {
        if (!userId || !branchId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await fetchWeeklySet(branchId);
            if (error) throw error;

            if (data?.success) {
                setCurrentSet(data);
                setQuestions(data.questions || []);
                writeDoc(WEEKLY_SET_DOC, data);
            } else {
                setCurrentSet(null);
                setQuestions([]);
                writeDoc<WeeklySet | null>(WEEKLY_SET_DOC, null);
            }
        } catch (err) {
            console.error('Error fetching weekly set:', err);
        } finally {
            setLoading(false);
        }
    }, [branchId, userId]);

    const generateSet = useCallback(async () => {
        if (!branchId) return;

        setLoading(true);
        const activeSubjects = getPracticeSubjects().map((s) => s.id);
        const activeExams = (targetExams ?? []).map((e) => e.toUpperCase());

        try {
            const { data, error } = await generateWeeklySet(
                activeSubjects,
                activeExams,
                branchId
            );

            if (error) throw error;

            if (data?.success && data?.status === 'existing') {
                toast.info('Already attempted a set this week');
            } else if (data?.success && data?.status === 'created') {
                toast.success(data?.message ?? 'Revision set ready');
            }

            if (data?.success) {
                await fetchCurrentSet();
                emitAppEvent('REVISION_UPDATED');
            }
        } catch (err) {
            console.error('Error generating set', err);
            toast.error('Error generating set.');
        } finally {
            setLoading(false);
        }
    }, [branchId, targetExams, getPracticeSubjects, fetchCurrentSet]);

    const startSet = useCallback(async (): Promise<string | null> => {
        if (!currentSet) return null;

        setLoading(true);
        try {
            const { data, error } = await startWeeklySet(currentSet.set_id);
            if (error) throw error;

            if (data?.success) {
                const updated: WeeklySet = {
                    ...currentSet,
                    started_at: data.started_at,
                    expires_at: data.expires_at,
                    status: 'started',
                };
                setCurrentSet(updated);
                writeDoc(WEEKLY_SET_DOC, updated);
            }

            return currentSet.set_id;
        } catch (err) {
            console.error('Error starting set:', err);
            return currentSet.set_id;
        } finally {
            setLoading(false);
        }
    }, [currentSet]);

    const getCriticalQuestionCount = useCallback(async () => {
        if (!userId) return;

        try {
            const activeSubjects = getPracticeSubjects().map((s) => s.id);
            const activeExams = (targetExams ?? []).map((e) => e.toUpperCase());

            const { data: count, error } = await fetchCriticalQuestionCount(
                activeSubjects,
                activeExams
            );
            if (error) throw error;

            setCriticalQuestionsCount(count ?? 0);
        } catch (err) {
            console.error('Error fetching critical question count:', err);
        }
    }, [userId, getPracticeSubjects, targetExams]);

    useEffect(() => {
        if (userId && userId !== '1') {
            void fetchCurrentSet();
            void getCriticalQuestionCount();
        } else {
            setLoading(false);
        }
    }, [fetchCurrentSet, getCriticalQuestionCount, userId]);

    return {
        loading,
        user,
        currentSet,
        questions,
        generateSet,
        fetchCurrentSet,
        startSet,
        criticalQuestionsCount,
        getCriticalQuestionCount,
    };
};

export default useSmartRevision;
