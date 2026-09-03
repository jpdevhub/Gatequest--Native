import type { Attempt, Question } from '@/shared/types/storage';
import { supabase } from '@/shared/utils/supabaseClient';

// ---------- Test Session CRUD ----------
export const fetchTestById = async (testId: string) => {
    const { data, error } = await supabase
        .from('topic_tests')
        .select('*')
        .eq('id', testId)
        .single();
    return { data, error };
};

export const fetchTestHistory = async (userId: string, branchId: string) => {
    const { data, error } = await supabase
        .from('topic_tests')
        .select('*')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);
    return { data, error };
};

export const getActiveTest = async (userId: string, branchId: string) => {
    const { data, error } = await supabase
        .from('topic_tests')
        .select('*')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .in('status', ['ongoing', 'paused', 'created'])
        .maybeSingle();
    return { data, error };
};

export const updateTestStatus = async (
    testId: string,
    status: 'ongoing' | 'paused' | 'completed',
    extraFields?: Record<string, unknown>
) => {
    const { error } = await supabase
        .from('topic_tests')
        .update({
            status,
            ...extraFields,
            updated_at: new Date().toISOString(),
        })
        .eq('id', testId);
    return { error };
};

export const updateTestTime = async (testId: string, remainingSeconds: number) => {
    const { error } = await supabase
        .from('topic_tests')
        .update({ remaining_time_seconds: remainingSeconds })
        .eq('id', testId);
    return { error };
};

// ---------- Attempts ----------
export const fetchAttemptsWithQuestions = async (testId: string) => {
    const { data, error } = await supabase
        .from('topic_tests_attempts')
        .select('*, questions(*)')
        .eq('session_id', testId)
        .order('attempt_order', { ascending: true });
    return { data, error };
};

export const upsertAttempts = async (payload: Record<string, unknown>[]) => {
    const { error } = await supabase
        .from('topic_tests_attempts')
        .upsert(payload as never, { onConflict: 'session_id, question_id' });
    return { error };
};

// ---------- Grading RPC ----------
export const submitTestGrading = async (
    sessionId: string,
    payload: Attempt[],
    remainingTime: number
) => {
    const { data, error } = await supabase.rpc('submit_test_grading', {
        p_session_id: sessionId,
        p_payload: payload as never,
        p_remaining_time_seconds: remainingTime,
    });
    return { data, error };
};

// ---------- Topics ----------
export const fetchTopicCounts = async (subjectId: string) => {
    const { data, error } = await supabase.rpc('get_topic_counts', {
        p_subject_id: subjectId,
    });
    return { data, error };
};

// ---------- Generation ----------
export type TopicFilter = { subject_id: string; topic: string };

export const generateTopicTest = async (
    filters: TopicFilter[],
    questionCount: number,
    totalSeconds: number,
    includeAttempted: boolean,
    branchId: string
) => {
    const { data, error } = await supabase.rpc('generate_topic_test', {
        p_filters: filters as never,
        p_question_count: questionCount,
        p_total_seconds: totalSeconds,
        p_already_attempted_questions: includeAttempted,
        p_branch_id: branchId,
    });
    return { data: data as { test_id?: string; error?: string; status?: string } | null, error };
};

// ---------- Sync ----------
type RawAttemptData = Attempt & { questions: Question | Question[] };

export const fetchFullTestData = async (userId: string, branchId: string) => {
    const { data: testSession, error } = await supabase
        .from('topic_tests')
        .select(
            `
            *,
            topic_tests_attempts (
                *,
                questions (*)
            )
        `
        )
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .in('status', ['ongoing', 'paused', 'created'])
        .maybeSingle();

    if (error || !testSession) return { testSession: null, attempts: null, questions: null };

    const record = testSession as Record<string, unknown>;
    const rawAttempts = (record.topic_tests_attempts as RawAttemptData[]) || [];

    const questions = rawAttempts
        .flatMap((a) => (Array.isArray(a.questions) ? a.questions : [a.questions]))
        .filter(Boolean) as Question[];

    const pureAttempts = rawAttempts.map(({ questions: _q, ...rest }) => rest as Attempt);

    delete record.topic_tests_attempts;

    return {
        testSession: record as unknown as import('@/shared/types/storage').TestSession,
        attempts: pureAttempts,
        questions,
    };
};
