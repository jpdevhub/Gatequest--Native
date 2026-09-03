/**
 * Practice question screen. Next/prev walk the list the user filtered on the
 * previous screen; a cold open (deep link, "continue session") falls back to the
 * full subject list.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import QuestionCard from '@/features/questions/components/QuestionCard/QuestionCard';
import { useQuestionController } from '@/features/questions/api/useQuestionController';
import { getNavigationList } from '@/features/questions/navigationList';
import useQuestions from '@/features/practice/hooks/useQuestions';
import { useGoals } from '@/providers/GoalProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';
import ReportModal from '@/shared/components/ReportModal';

export default function PracticeQuestionScreen() {
    const { subject, qid } = useLocalSearchParams<{ subject: string; qid: string }>();
    const router = useRouter();
    const { getPracticeSubjects } = useGoals();

    const slug = subject ?? '';
    const subjectMeta = useMemo(
        () => getPracticeSubjects().find((s) => s.slug === slug),
        [getPracticeSubjects, slug]
    );

    const { questions, isLoading } = useQuestions(subjectMeta?.id);

    const orderedQuestions = useMemo(() => {
        const ids = getNavigationList(`practice:${slug}`);
        if (!ids || ids.length === 0) return questions;

        const byId = new Map(questions.map((q) => [q.id, q]));
        const ordered = ids.map((id) => byId.get(id)).filter((q) => !!q);
        return ordered.length > 0 ? ordered : questions;
    }, [questions, slug]);

    const goBack = () =>
        router.canGoBack() ? router.back() : router.replace(`/practice/${slug}`);

    const { currentQuestion, isLoading: controllerLoading, cardProps, modalProps } =
        useQuestionController({
            questions: orderedQuestions,
            mode: 'practice',
            subjectSlug: slug,
            qid,
            onBack: goBack,
        });

    if (isLoading || controllerLoading || !currentQuestion) return <ModernLoader />;

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <QuestionCard {...cardProps} />
            <ReportModal {...modalProps} />
        </View>
    );
}
