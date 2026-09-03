/**
 * Read-only solution view for one question of a completed test.
 * Reuses the practice QuestionCard with the reveal already applied.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';
import { handleReport } from '@/features/questions/api/questions';
import QuestionCard from '@/features/questions/components/QuestionCard/QuestionCard';
import { usePeerBenchmark } from '@/features/questions/hooks/usePeerBenchmark';
import {
    isMultipleSelection,
    isNumericalQuestion,
} from '@/features/questions/utils/questionUtils';
import useTestResult from '@/features/topic-test/hooks/useTestResult';
import { useAuth } from '@/providers/AuthProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';
import ReportModal from '@/shared/components/ReportModal';
import type { Question } from '@/shared/types/storage';

export default function TestSolutionScreen() {
    const { testId, qIndex } = useLocalSearchParams<{ testId: string; qIndex: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { attempts, loading } = useTestResult(testId);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const currentIndex = Number.parseInt(qIndex || '0', 10);
    const currentAttempt = attempts[currentIndex];
    const currentQuestion = currentAttempt?.questions;

    const safeQuestion = useMemo(
        () =>
            currentQuestion ||
            ({ id: '0', options: [], correct_answer: [], subject: '', subject_id: '' } as unknown as Question),
        [currentQuestion]
    );

    const normalized = useMemo(() => {
        if (!currentAttempt || !currentQuestion) return null;

        const isMSQ = isMultipleSelection(currentQuestion);
        const isNAT = isNumericalQuestion(currentQuestion);
        const ans = currentAttempt.user_answer;

        return {
            userAnswerIndex: !isMSQ && !isNAT && typeof ans === 'number' ? ans : null,
            selectedOptionIndices: isMSQ && Array.isArray(ans) ? ans : [],
            numericalAnswer: isNAT && ans !== null && typeof ans === 'number' ? ans : null,
            result: (currentAttempt.status === 'answered'
                ? currentAttempt.is_correct === true
                    ? 'correct'
                    : 'incorrect'
                : 'unattempted') as 'correct' | 'incorrect' | 'unattempted',
            marked: currentAttempt.marked_for_review,
        };
    }, [currentAttempt, currentQuestion]);

    const { benchmarkDetails, loading: statsLoading, message: statsMessage } = usePeerBenchmark(
        safeQuestion.id
    );

    const handleReportSubmit = async (reportType: string, reportText: string) => {
        if (!user?.id) {
            toast.error('You must be logged in to report a question.');
            return;
        }
        setReportSubmitting(true);
        try {
            const { error } = await handleReport({
                user_id: user.id,
                question_id: safeQuestion.id,
                report_type: reportType,
                report_text: reportText,
            });
            if (error) {
                if (error.code === '23505') toast.error('Already reported by you.');
                else toast.error('Error submitting report.');
            } else {
                toast.success('Thank you for the report!');
                setShowReportModal(false);
            }
        } finally {
            setReportSubmitting(false);
        }
    };

    if (loading) return <ModernLoader />;
    if (!currentAttempt || !currentQuestion || !normalized) {
        router.replace(`/topic-test/${testId}/result`);
        return <ModernLoader />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <QuestionCard
                question={currentQuestion}
                totalQuestions={attempts.length}
                questionNumber={currentIndex + 1}
                subjectSlug={undefined}
                userAnswerIndex={normalized.userAnswerIndex}
                selectedOptionIndices={normalized.selectedOptionIndices}
                numericalAnswer={normalized.numericalAnswer}
                marked={normalized.marked}
                showAnswer
                result={normalized.result}
                peerStats={{
                    loading: statsLoading,
                    message: statsMessage,
                    data: benchmarkDetails,
                }}
                onNext={() => {
                    if (currentIndex < attempts.length - 1) {
                        router.replace(`/topic-test/${testId}/review/${currentIndex + 1}`);
                    }
                }}
                onPrev={() => {
                    if (currentIndex > 0) {
                        router.replace(`/topic-test/${testId}/review/${currentIndex - 1}`);
                    }
                }}
                onReport={() => setShowReportModal(true)}
                onShare={() => {}}
                onExplanationClick={() => {}}
                onBack={() => router.replace(`/topic-test/${testId}/result`)}
                isFirst={currentIndex === 0}
                isLast={currentIndex === attempts.length - 1}
            />

            <ReportModal
                questionId={safeQuestion.id}
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReportSubmit}
                reportSubmitting={reportSubmitting}
            />
        </View>
    );
}
