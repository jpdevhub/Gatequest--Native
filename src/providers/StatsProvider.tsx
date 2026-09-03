import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { readDoc, writeDoc } from '@/shared/storage/appStorage';
import type { Stats, SubjectStat } from '@/shared/types/Stats';
import type { DashboardResponse } from '@/shared/types/StatsType';
import { onAppEvent } from '@/shared/utils/appEvents';
import { getUserProfile } from '@/shared/utils/helper';
import { supabase } from '@/shared/utils/supabaseClient';
import { useGoals } from './GoalProvider';

const STATS_CACHE_DOC = 'dashboard_stats';

const EMPTY_STATS: Stats = {
    progress: 0,
    accuracy: 0,
    subjectStats: [],
    subjectStatsMap: {},
    question: new Set(),
    streaks: { study_current: 0, study_longest: 0, learning_current: 0, learning_longest: 0 },
    heatmapData: [],
    studyPlan: {
        totalQuestions: 0,
        uniqueAttemptCount: 0,
        remainingQuestions: 0,
        daysLeft: 0,
        dailyQuestionTarget: 0,
        todayUniqueAttemptCount: 0,
        progressPercent: 0,
        todayProgressPercent: 0,
        isTargetMetToday: false,
    },
};

interface StatsContextType {
    stats: Stats;
    loading: boolean;
    updateStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

// `question` is a Set, which JSON cannot represent — it is rebuilt empty on load,
// matching the PWA where it is only populated in-session.
type CachedStats = Omit<Stats, 'question'>;

export function StatsProvider({ children }: { children: React.ReactNode }) {
    const [stats, setStats] = useState<Stats>(() => {
        const cached = readDoc<CachedStats | null>(STATS_CACHE_DOC, null);
        return cached ? { ...cached, question: new Set<string>() } : EMPTY_STATS;
    });
    const [loading, setLoading] = useState(true);
    const { userGoal } = useGoals();

    /**
     * Port of the PWA StatsProvider: one `get_my_dashboard` RPC returns heatmap,
     * streaks, per-exam subject stats and study-plan numbers already aggregated.
     */
    const updateStats = useCallback(async () => {
        const user = getUserProfile();

        if (!user || user.id === '1' || user.version_number === undefined) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('get_my_dashboard');

            if (error || !data) {
                console.error('Supabase RPC error:', error);
                setLoading(false);
                return;
            }

            const dashboardData = data as unknown as DashboardResponse;

            const rawTargetExams = (userGoal?.target_exams as string[]) || ['gate'];
            const activeExams = rawTargetExams.map((e) => e.toLowerCase());
            const primaryExam = activeExams[0] || 'gate';

            const findExamStats = (examName: string) => {
                const keys = Object.keys(dashboardData.exam_stats || {});
                const matchKey = keys.find((k) => k.toLowerCase() === examName.toLowerCase());
                return matchKey ? dashboardData.exam_stats[matchKey] : null;
            };

            const primaryExamStats = findExamStats(primaryExam) || {
                overall_accuracy: 0,
                overall_attempted: 0,
                total_available: 0,
                subjects: [],
            };

            const newSubjectStatsMap: Record<string, SubjectStat[]> = {};
            activeExams.forEach((exam) => {
                newSubjectStatsMap[exam.toUpperCase()] = findExamStats(exam)?.subjects || [];
            });

            const defaultSubjectStats = primaryExamStats.subjects || [];

            const totalQuestions = primaryExamStats.total_available || 0;
            const uniqueAttemptCount = primaryExamStats.overall_attempted || 0;
            const remainingQuestions = Math.max(totalQuestions - uniqueAttemptCount, 0);
            const progressPercent =
                totalQuestions > 0 ? Math.round((uniqueAttemptCount / totalQuestions) * 100) : 0;

            const dbStats = dashboardData.dashboard_stats || {};

            const next: Stats = {
                progress: progressPercent,
                accuracy: primaryExamStats.overall_accuracy || 0,
                subjectStats: defaultSubjectStats,
                subjectStatsMap: newSubjectStatsMap,
                question: new Set<string>(),
                heatmapData: dashboardData.heatmap || [],
                streaks: {
                    learning_current: dashboardData.streaks?.learning_current || 0,
                    learning_longest: dashboardData.streaks?.learning_longest || 0,
                    study_current: dashboardData.streaks?.study_current || 0,
                    study_longest: dashboardData.streaks?.study_longest || 0,
                },
                studyPlan: {
                    totalQuestions,
                    uniqueAttemptCount,
                    remainingQuestions,
                    daysLeft: dbStats.days_left || 0,
                    dailyQuestionTarget: dbStats.daily_question_target || 0,
                    todayUniqueAttemptCount: dbStats.today_unique_attempt_count || 0,
                    progressPercent,
                    todayProgressPercent: dbStats.today_progress_percent || 0,
                    isTargetMetToday: dbStats.is_target_met_today || false,
                },
            };

            setStats(next);

            // Cached so the dashboard renders immediately (and offline) on next launch.
            const { question: _question, ...cacheable } = next;
            writeDoc<CachedStats>(STATS_CACHE_DOC, cacheable);
        } catch (err) {
            console.error('Failed to update stats:', err);
        } finally {
            setLoading(false);
        }
    }, [userGoal]);

    useEffect(() => {
        const user = getUserProfile();
        if (!user || user.id === '1') {
            setLoading(false);
            return;
        }
        void updateStats();
    }, [updateStats]);

    useEffect(() => onAppEvent('STATS_UPDATED', () => void updateStats()), [updateStats]);
    useEffect(() => onAppEvent('REVISION_UPDATED', () => void updateStats()), [updateStats]);

    return (
        <StatsContext.Provider value={{ stats, loading, updateStats }}>
            {children}
        </StatsContext.Provider>
    );
}

export function useStats(): StatsContextType {
    const ctx = useContext(StatsContext);
    if (!ctx) throw new Error('useStats must be used within StatsProvider');
    return ctx;
}
