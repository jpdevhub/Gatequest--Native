import React, { createContext, useContext } from 'react';
import { ModernLoader } from '@/shared/components/ModernLoader';
import useTestLoader from '../hooks/test-engine/useTestLoader';
import useTestSession, { type UseTestSessionReturn } from '../hooks/test-engine/useTestSession';

const TestSessionContext = createContext<UseTestSessionReturn | null>(null);

function TestSessionInner({
    testId,
    data,
    onFinished,
    children,
}: {
    testId: string;
    data: NonNullable<ReturnType<typeof useTestLoader>['data']>;
    onFinished: (testId: string) => void;
    children: React.ReactNode;
}) {
    const session = useTestSession(testId, data, onFinished);
    return <TestSessionContext.Provider value={session}>{children}</TestSessionContext.Provider>;
}

export function TestSessionProvider({
    testId,
    onFinished,
    children,
}: {
    testId: string;
    onFinished: (testId: string) => void;
    children: React.ReactNode;
}) {
    const { data, loading } = useTestLoader(testId);

    if (loading || !data) return <ModernLoader />;

    return (
        <TestSessionInner testId={testId} data={data} onFinished={onFinished}>
            {children}
        </TestSessionInner>
    );
}

export default function useTest(): UseTestSessionReturn {
    const context = useContext(TestSessionContext);
    if (!context) throw new Error('useTest must be used within a TestSessionProvider');
    return context;
}
