/**
 * Question list for one subject. `subject` is the subject slug, matching the PWA route.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import QuestionsList from '@/features/questions/components/QuestionsList/QuestionsList';
import { setNavigationList } from '@/features/questions/navigationList';
import useQuestions from '@/features/practice/hooks/useQuestions';
import { useGoals } from '@/providers/GoalProvider';
import type { Question } from '@/shared/types/storage';

export default function SubjectQuestionsScreen() {
    const { subject } = useLocalSearchParams<{ subject: string }>();
    const router = useRouter();
    const { getPracticeSubjects, userGoal } = useGoals();

    const slug = subject ?? '';
    const subjectMeta = useMemo(
        () => getPracticeSubjects().find((s) => s.slug === slug),
        [getPracticeSubjects, slug]
    );

    const { questions, isLoading } = useQuestions(subjectMeta?.id);

    const availableExams = useMemo(() => {
        const target = ((userGoal?.target_exams as string[]) ?? []).map((e) => e.toUpperCase());
        return subjectMeta?.is_universal ? ['GATE', 'ISRO'] : target;
    }, [subjectMeta, userGoal]);

    const handlePress = (id: string, list: Question[]) => {
        setNavigationList(`practice:${slug}`, list.map((q) => q.id));
        router.push(`/practice/${slug}/${id}`);
    };

    return (
        <QuestionsList
            questions={questions}
            title={subjectMeta?.name ?? 'Questions'}
            subjectSlug={slug}
            mode="practice"
            isLoading={isLoading}
            availableExams={availableExams}
            onQuestionPress={handlePress}
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/practice'))}
        />
    );
}
