import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import ActiveTest from '@/features/topic-test/components/active-test/ActiveTest';
import { TestSessionProvider } from '@/features/topic-test/context/TestSessionProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';

export default function TopicTestSessionScreen() {
    const { testId } = useLocalSearchParams<{ testId: string }>();
    const router = useRouter();

    const handleFinished = useCallback(
        (id: string) => router.replace(`/topic-test/${id}/result`),
        [router]
    );

    if (!testId) return <ModernLoader />;

    return (
        <TestSessionProvider testId={testId} onFinished={handleFinished}>
            <ActiveTest />
        </TestSessionProvider>
    );
}
