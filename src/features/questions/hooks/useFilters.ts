/**
 * useFilters — port of the PWA question-list filtering.
 * Attempted/bookmarked ids come from Supabase RPCs; window events become appEvents.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Question, RevisionQuestion } from '@/shared/types/storage';
import { onAppEvent } from '@/shared/utils/appEvents';
import { normalizeTag, sortQuestionsByYear } from '@/shared/utils/helper';
import { supabase } from '@/shared/utils/supabaseClient';

type FilterMode = 'practice' | 'revision';
export type AttemptFilterMode = 'all' | 'attempted' | 'unattempted' | 'bookmarked';

const useFilters = (
    sourceQuestions: Question[] | RevisionQuestion[],
    subject: string | null,
    selectedQuestion: string | null,
    mode: FilterMode
) => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
    const [yearFilter, setYearFilter] = useState<string[]>([]);
    const [topicFilter, setTopicFilter] = useState<string[]>([]);
    const [attemptFilter, setAttemptFilter] = useState<AttemptFilterMode>('unattempted');
    const [examFilter, setExamFilter] = useState<string[]>([]);
    const [tagFilter, setTagFilter] = useState<string[]>([]);

    const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        let active = true;

        async function fetchAttemptedIds() {
            if (!subject && mode === 'practice') return;
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_user_attempted_ids', {
                    p_subject_slug: subject ?? undefined,
                    p_mode: mode,
                });
                if (error) throw error;
                if (active) setAttemptedIds(new Set((data ?? []).map((row) => row.question_id)));
            } catch (error) {
                console.error('Failed to fetch attempted questions:', error);
                if (active) setAttemptedIds(new Set());
            } finally {
                if (active) setLoading(false);
            }
        }

        void fetchAttemptedIds();
        const off = onAppEvent('STATS_UPDATED', () => void fetchAttemptedIds());

        return () => {
            active = false;
            off();
        };
    }, [subject, mode]);

    useEffect(() => {
        let active = true;

        async function fetchBookmarkedIds() {
            if (!subject && mode === 'practice') return;
            try {
                const { data, error } = await supabase.rpc('get_user_bookmarks', {
                    p_subject_slug: subject ?? undefined,
                });
                if (error) throw error;
                if (active) setBookmarkedIds(new Set((data ?? []).map((row) => row.question_id)));
            } catch (error) {
                console.error('Failed to fetch bookmarks:', error);
                if (active) setBookmarkedIds(new Set());
            }
        }

        if (attemptFilter === 'bookmarked') void fetchBookmarkedIds();
        const off = onAppEvent('BOOKMARKS_UPDATED', () => void fetchBookmarkedIds());

        return () => {
            active = false;
            off();
        };
    }, [subject, mode, attemptFilter]);

    const filteredQuestions = useMemo(() => {
        let filtered = [...sourceQuestions];

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(
                (qn) =>
                    qn.question?.toLowerCase().includes(q) ||
                    qn.tags?.some((tag) => tag.toLowerCase().includes(q))
            );
        }

        if (difficultyFilter.length > 0) {
            filtered = filtered.filter((qn) => difficultyFilter.includes(qn.difficulty || ''));
        }

        if (yearFilter.length > 0) {
            filtered = filtered.filter((qn) => yearFilter.includes(qn.year?.toString() || ''));
        }

        if (topicFilter.length > 0) {
            filtered = filtered.filter((qn) => topicFilter.includes(qn.topic || ''));
        }

        if (attemptFilter && attemptFilter !== 'all') {
            filtered = filtered.filter((qn) => {
                const isActive = qn.id === selectedQuestion;
                const isAttempted = attemptedIds.has(qn.id);

                if (attemptFilter === 'bookmarked') return bookmarkedIds.has(qn.id) || isActive;

                return attemptFilter === 'attempted' ? isAttempted : !isAttempted || isActive;
            });
        }

        if (examFilter.length > 0) {
            filtered = filtered.filter((qn) => {
                const examData = qn.metadata?.exam as string | string[] | undefined;
                if (!examData) return false;
                const exams = Array.isArray(examData) ? examData : [examData];
                return exams.some((e) => examFilter.some((f) => f.toUpperCase() === e.toUpperCase()));
            });
        }

        if (tagFilter.length > 0) {
            filtered = filtered.filter((qn) =>
                qn.tags?.some((tag) => tagFilter.includes(normalizeTag(tag)))
            );
        }

        return sortQuestionsByYear(filtered);
    }, [
        sourceQuestions,
        searchQuery,
        difficultyFilter,
        yearFilter,
        topicFilter,
        attemptFilter,
        attemptedIds,
        examFilter,
        selectedQuestion,
        tagFilter,
        bookmarkedIds,
    ]);

    const resetFilters = () => {
        setSearchQuery('');
        setDifficultyFilter([]);
        setYearFilter([]);
        setTopicFilter([]);
        setExamFilter([]);
        setTagFilter([]);
        setAttemptFilter('all');
    };

    return {
        loading,
        filteredQuestions,
        attemptedIds,
        bookmarkedIds,
        searchQuery,
        setSearchQuery,
        difficultyFilter,
        setDifficultyFilter,
        yearFilter,
        setYearFilter,
        topicFilter,
        setTopicFilter,
        attemptFilter,
        setAttemptFilter,
        examFilter,
        setExamFilter,
        tagFilter,
        setTagFilter,
        resetFilters,
    };
};

export default useFilters;
