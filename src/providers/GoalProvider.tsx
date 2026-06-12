import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/shared/utils/supabaseClient';
import { toast } from 'sonner-native';

// ── Types (mirrors PWA GoalContext.ts) ──────────────────────────────────────
// Using plain interfaces to avoid requiring the generated supabase.ts at this stage.
export interface Branch { id: string; name: string; [key: string]: unknown; }
export interface Exam { id: string; name: string; [key: string]: unknown; }
export interface BranchExam { branch_id: string; exam_id: string; [key: string]: unknown; }
export interface Subject { id: string; name: string; slug: string; is_universal: boolean; [key: string]: unknown; }
export interface UserGoal { id: string; user_id: string; branch_id: string; target_exams: unknown; is_active: boolean; [key: string]: unknown; }
export interface BranchSubjects { branch_id: string; subject_id: string; }
export interface ExamSubjects { exams_id: string; subject_id: string; }

interface GoalContextType {
  branches: Branch[];
  exams: Exam[];
  branchExams: BranchExam[];
  subjects: Subject[];
  userGoal: UserGoal | null;
  loading: boolean;
  error: string | null;
  setInitialGoal: (branchId: string, examIds: string[], silent?: boolean) => Promise<void>;
  getPracticeSubjects: () => Subject[];
  isSubjectInGoal: (subjectId: string) => boolean | undefined;
  refresh: () => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const [branchSubjects, setBranchSubjects] = useState<BranchSubjects[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubjects[]>([]);
  const [branchExams, setBranchExams] = useState<BranchExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Exact port from PWA GoalProvider.tsx
  const fetchData = useCallback(async (force = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || (fetchedRef.current && !force)) return;
    try {
      setLoading(true);
      fetchedRef.current = true;
      const [resBranches, resExams, resSubjects, resUserGoal, resBS, resES, resBE] = await Promise.all([
        supabase.from('branches').select('*'),
        supabase.from('exams').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('user_goals').select('*').eq('is_active', true).maybeSingle(),
        supabase.from('branch_subjects').select('*'),
        supabase.from('exams_subjects').select('*'),
        supabase.from('branch_exams').select('*'),
      ]);
      if (resBranches.error) throw resBranches.error;
      setBranches(resBranches.data as Branch[] || []);
      setExams(resExams.data as Exam[] || []);
      setSubjects(resSubjects.data as Subject[] || []);
      setUserGoal(resUserGoal.data as UserGoal || null);
      setBranchSubjects(resBS.data as BranchSubjects[] || []);
      setExamSubjects(resES.data as ExamSubjects[] || []);
      setBranchExams(resBE.data as BranchExam[] || []);
    } catch (err) {
      fetchedRef.current = false;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      toast.error('Failed to sync goal data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') fetchData();
      if (event === 'SIGNED_OUT') { setUserGoal(null); setLoading(false); fetchedRef.current = false; }
    });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const setInitialGoal = useCallback(async (branchId: string, examIds: string[], silent = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      setLoading(true);
      await supabase.from('user_goals').update({ is_active: false }).eq('user_id', user.id);
      const { data, error } = await supabase.from('user_goals')
        .upsert({ user_id: user.id, branch_id: branchId, target_exams: examIds, is_active: true }, { onConflict: 'user_id, branch_id' })
        .select().single();
      if (error) { if (!silent) toast.error('Failed to set your goals.'); return; }
      setUserGoal(data as UserGoal);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPracticeSubjects = useCallback((): Subject[] => {
    if (!userGoal) return [];
    const selectedExamIds = userGoal.target_exams as string[];
    const subjectsInBranch = branchSubjects.filter(bs => bs.branch_id === userGoal.branch_id).map(bs => bs.subject_id);
    const subjectsInExams = examSubjects.filter(es => selectedExamIds.includes(es.exams_id)).map(es => es.subject_id);
    return subjects.filter(s => (s.is_universal || subjectsInBranch.includes(s.id)) && subjectsInExams.includes(s.id));
  }, [userGoal, branchSubjects, examSubjects, subjects]);

  const isSubjectInGoal = useCallback((subjectId: string) => {
    if (!userGoal) return undefined;
    const subject = subjects.find(s => s.id === subjectId);
    if (subject?.is_universal) return true;
    return branchSubjects.some(bs => bs.branch_id === userGoal.branch_id && bs.subject_id === subjectId);
  }, [userGoal, subjects, branchSubjects]);

  const value = useMemo(() => ({
    branches, exams, branchExams, subjects, userGoal, loading, error,
    setInitialGoal, getPracticeSubjects, isSubjectInGoal,
    refresh: () => fetchData(true),
  }), [branches, exams, branchExams, subjects, userGoal, loading, error, setInitialGoal, getPracticeSubjects, isSubjectInGoal, fetchData]);

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoals(): GoalContextType {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoals must be used within GoalProvider');
  return ctx;
}
