/**
 * The questions inside one weekly revision set. Reads the set cached by
 * useSmartRevision so it resumes offline, mirroring the PWA's localStorage recovery.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import QuestionsList from '@/features/questions/components/QuestionsList/QuestionsList';
import { setNavigationList } from '@/features/questions/navigationList';
import { getCachedWeeklySet } from '@/features/smart-revision/hooks/useSmartRevision';
import type { Question } from '@/shared/types/storage';

export default function RevisionQuestionListScreen() {
    const { rid } = useLocalSearchParams<{ rid: string }>();
    const router = useRouter();

    const questions = useMemo(() => getCachedWeeklySet()?.questions ?? [], []);

    const handlePress = (id: string, list: Question[]) => {
        setNavigationList(`revision:${rid}`, list.map((q) => q.id));
        router.push(`/revision/${rid}/${id}`);
    };

    return (
        <QuestionsList
            questions={questions}
            title="Revision questions"
            subjectSlug={null}
            mode="revision"
            onQuestionPress={handlePress}
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/revision'))}
        />
    );
}
