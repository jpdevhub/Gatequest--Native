/**
 * testSession — port of the PWA's Dexie-backed test session store.
 * Same function names and semantics; the backing store is appStorage instead of Dexie.
 */
import { bulkUpsertQuestions, getQuestionByIds } from '@/shared/storage/questionRepository';
import { readDoc, updateDoc } from '@/shared/storage/appStorage';
import type { Attempt, Question, TestSession } from '@/shared/types/storage';

const SESSIONS_DOC = 'test_sessions';
const ATTEMPTS_DOC = 'test_attempts';

type SessionMap = Record<string, TestSession>;
type AttemptMap = Record<string, Attempt>;

const attemptKey = (sessionId: string, questionId: string) => `${sessionId}::${questionId}`;

const readSessions = () => readDoc<SessionMap>(SESSIONS_DOC, {});
const readAttempts = () => readDoc<AttemptMap>(ATTEMPTS_DOC, {});

export const initializeTestSession = async (
    session: TestSession,
    attempts: Attempt[],
    questions: Question[]
) => {
    updateDoc<SessionMap>(SESSIONS_DOC, {}, (current) => ({
        ...current,
        [session.id]: { ...current[session.id], ...session },
    }));

    updateDoc<AttemptMap>(ATTEMPTS_DOC, {}, (current) => {
        const next = { ...current };
        for (const attempt of attempts) {
            next[attemptKey(attempt.session_id, attempt.question_id)] = attempt;
        }
        return next;
    });

    bulkUpsertQuestions(questions);
};

export const getTestSession = async (sessionId: string) => {
    const session = readSessions()[sessionId];
    if (!session) return null;

    const attempts = Object.values(readAttempts())
        .filter((a) => a.session_id === sessionId)
        .sort((a, b) => a.attempt_order - b.attempt_order);

    const questions = getQuestionByIds(attempts.map((a) => a.question_id));

    return { session, attempts, questions };
};

export const updateAttempts = async (
    testId: string,
    updatedAttempts: Attempt[],
    attempted: number,
    totalScore: number,
    correctCount: number
) => {
    if (updatedAttempts.length > 0) {
        updateDoc<AttemptMap>(ATTEMPTS_DOC, {}, (current) => {
            const next = { ...current };
            for (const attempt of updatedAttempts) {
                next[attemptKey(attempt.session_id, attempt.question_id)] = attempt;
            }
            return next;
        });
    }

    updateDoc<SessionMap>(SESSIONS_DOC, {}, (current) => {
        const session = current[testId];
        if (!session) return current;
        return {
            ...current,
            [testId]: {
                ...session,
                score: totalScore,
                accuracy: attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0,
                correct_count: correctCount,
                attempted_count: attempted,
                status: 'completed',
                completed_at: new Date().toISOString(),
                is_synced: 0,
            },
        };
    });
};

export const getOngoingTestSession = async (branchId?: string) => {
    const sessions = Object.values(readSessions()).filter((s) =>
        ['ongoing', 'paused', 'created'].includes(s.status)
    );
    return branchId ? sessions.filter((s) => s.branch_id === branchId) : sessions;
};

export const getCompletedTestSessions = async (branchId?: string) => {
    const sessions = Object.values(readSessions()).filter((s) => s.status === 'completed');
    const filtered = branchId ? sessions.filter((s) => s.branch_id === branchId) : sessions;

    return filtered.sort(
        (a, b) =>
            new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
    );
};

export const cacheTestSessions = async (sessions: TestSession[]) => {
    updateDoc<SessionMap>(SESSIONS_DOC, {}, (current) => {
        const next = { ...current };
        for (const session of sessions) next[session.id] = { ...next[session.id], ...session };
        return next;
    });
};

export const saveAttempt = async (attempt: Attempt) => {
    updateDoc<AttemptMap>(ATTEMPTS_DOC, {}, (current) => ({
        ...current,
        [attemptKey(attempt.session_id, attempt.question_id)]: attempt,
    }));
};

export const updateSessionTimeAndStatus = async (
    sessionId: string,
    time: number,
    status: string
) => {
    updateDoc<SessionMap>(SESSIONS_DOC, {}, (current) => {
        const session = current[sessionId];
        if (!session) return current;
        return {
            ...current,
            [sessionId]: {
                ...session,
                remaining_time_seconds: time,
                status,
                is_synced: 0,
            },
        };
    });
};

export const getPendingAttempts = async () =>
    Object.values(readAttempts()).filter((a) => a.is_synced === 0);

export const getPendingSessions = async () =>
    Object.values(readSessions()).filter((s) => s.is_synced === 0);

export const markAttemptsSynced = async (attempts: Attempt[]) => {
    updateDoc<AttemptMap>(ATTEMPTS_DOC, {}, (current) => {
        const next = { ...current };
        for (const attempt of attempts) {
            const key = attemptKey(attempt.session_id, attempt.question_id);
            if (next[key]) next[key] = { ...next[key], is_synced: 1 };
        }
        return next;
    });
};
