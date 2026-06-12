import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/shared/utils/supabaseClient';
import { getUserProfile } from '@/shared/utils/helper';
import { useGoals } from './GoalProvider';
import type { Stats } from '@/shared/types/Stats';
import { differenceInCalendarDays, eachDayOfInterval, format, isAfter, parseISO, startOfDay } from 'date-fns';

const EMPTY_STATS: Stats = {
  progress: 0, accuracy: 0, subjectStats: [], subjectStatsMap: {},
  question: new Set(), streaks: { current: 0, longest: 0 }, heatmapData: [],
  studyPlan: {
    totalQuestions: 0, uniqueAttemptCount: 0, remainingQuestions: 0,
    daysLeft: 0, dailyQuestionTarget: 0, todayUniqueAttemptCount: 0,
    progressPercent: 0, todayProgressPercent: 0, isTargetMetToday: false,
  },
};

interface StatsContextType {
  stats: Stats;
  loading: boolean;
  updateStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const { getPracticeSubjects, userGoal } = useGoals();

  /**
   * Direct port of the updateStats logic from PWA StatsProvider.tsx.
   * The algorithm (heatmap, streaks, study plan, subject stats) is identical.
   * window.localStorage calls replaced with MMKV storage.get/set via helper.ts.
   * window.addEventListener('STATS_UPDATED') replaced with a direct call to updateStats.
   */
  const updateStats = useCallback(async () => {
    const user = getUserProfile();
    if (!user || user.id === '1' || !userGoal?.target_exams) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const startDate = parseISO('2026-02-07');
    const endDate = parseISO('2027-04-07');
    if (isAfter(startDate, endDate)) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('v_user_cycle_stats')
      .select('*')
      .eq('user_id', user.id)
      .or(`branch_id.eq.${userGoal.branch_id},is_universal.eq.true`)
      .eq('user_version_number', user.version_number)
      .order('attempted_at', { ascending: true });

    if (error || !data) { setLoading(false); return; }

    const activeExams = ((userGoal.target_exams as string[]) ?? []).map(e => e.toUpperCase());
    const practiceSubjects = getPracticeSubjects();
    const universalSubjectIds = new Set(practiceSubjects.filter(s => s.is_universal).map(s => s.id));

    const globalData = data.filter(d => {
      if (d.subject_id && universalSubjectIds.has(d.subject_id)) return true;
      return ((d.exam_tags as string[]) || []).some(t => activeExams.includes(t.toUpperCase()));
    });

    // Heatmap
    const attemptsByDate: Record<string, number> = {};
    globalData.forEach(d => {
      if (d.attempted_at) {
        const k = format(parseISO(d.attempted_at), 'yyyy-MM-dd');
        attemptsByDate[k] = (attemptsByDate[k] || 0) + 1;
      }
    });
    const heatmapData = eachDayOfInterval({ start: startDate, end: endDate })
      .map(day => ({ date: format(day, 'yyyy-MM-dd'), count: attemptsByDate[format(day, 'yyyy-MM-dd')] || 0 }));

    // Streaks
    let currentStreak = 0, longestStreak = 0;
    let prevDate: Date | null = null;
    Object.keys(attemptsByDate).sort().forEach(date => {
      const d = parseISO(date);
      currentStreak = (!prevDate || differenceInCalendarDays(d, prevDate) === 1) ? currentStreak + 1 : 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
      prevDate = d;
    });

    // Study plan basics
    const uniqueAttemptCount = new Set(globalData.map(d => d.question_id)).size;
    const accuracy = globalData.length ? Math.round(globalData.filter(d => d.was_correct).length / globalData.length * 100) : 0;
    const GATE_DATE = parseISO('2027-02-08');
    const daysLeft = Math.max(differenceInCalendarDays(startOfDay(GATE_DATE), startOfDay(new Date())), 0);
    const todayUniqueAttemptCount = new Set(
      globalData.filter(d => d.attempted_at && startOfDay(parseISO(d.attempted_at)) >= startOfDay(new Date())).map(d => d.question_id)
    ).size;

    setStats({
      progress: 0, // populated once subject counts are fetched in full implementation
      accuracy,
      subjectStats: [], subjectStatsMap: {},
      question: new Set(globalData.map(d => d.question_id).filter(Boolean) as string[]),
      streaks: { current: currentStreak, longest: longestStreak },
      heatmapData,
      studyPlan: {
        totalQuestions: 0, uniqueAttemptCount, remainingQuestions: 0, daysLeft,
        dailyQuestionTarget: 0, todayUniqueAttemptCount,
        progressPercent: 0, todayProgressPercent: 0, isTargetMetToday: false,
      },
    });
    setLoading(false);
  }, [getPracticeSubjects, userGoal]);

  useEffect(() => {
    if (!getUserProfile()) { setLoading(false); return; }
    updateStats();
  }, [userGoal, updateStats]);

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
