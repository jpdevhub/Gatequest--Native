import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useQuestionController } from '@/features/questions/api/useQuestionController';
import QuestionCard from '@/features/questions/components/QuestionCard/QuestionCard';
import { getNavigationList } from '@/features/questions/navigationList';
import { getCachedWeeklySet } from '@/features/smart-revision/hooks/useSmartRevision';
import { ModernLoader } from '@/shared/components/ModernLoader';
import ReportModal from '@/shared/components/ReportModal';

export default function RevisionQuestionScreen() {
    const { rid, qid } = useLocalSearchParams<{ rid: string; qid: string }>();
    const router = useRouter();

    const questions = useMemo(() => {
        const all = getCachedWeeklySet()?.questions ?? [];
        const ids = getNavigationList(`revision:${rid}`);
        if (!ids || ids.length === 0) return all;

        const byId = new Map(all.map((q) => [q.id, q]));
        const ordered = ids.map((id) => byId.get(id)).filter((q) => !!q);
        return ordered.length > 0 ? ordered : all;
    }, [rid]);

    const goBack = () =>
        router.canGoBack() ? router.back() : router.replace(`/revision/${rid}`);

    const { currentQuestion, isLoading, cardProps, modalProps } = useQuestionController({
        questions,
        mode: 'revision',
        revisionId: rid,
        qid,
        onBack: goBack,
    });

    if (isLoading || !currentQuestion) return <ModernLoader />;

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <QuestionCard {...cardProps} />
            <ReportModal {...modalProps} />
        </View>
    );
}
