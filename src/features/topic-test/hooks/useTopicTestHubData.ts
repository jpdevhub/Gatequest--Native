import { useCallback, useEffect, useState } from 'react';
import {
    cacheTestSessions,
    getCompletedTestSessions,
    getOngoingTestSession,
} from '@/features/topic-test/services/testSession';
import type { TestSession } from '@/shared/types/storage';
import { fetchTestHistory } from '../api/topicTest';
import { syncTestFromSupabase } from '../services/testSyncService';

const useTopicTestHubData = (userId: string | undefined, branchId: string | undefined) => {
    const [activeTest, setActiveTest] = useState<TestSession | null>(null);
    const [history, setHistory] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!userId || !branchId) {
            setLoading(false);
            return;
        }

        try {
            let localSession = await getOngoingTestSession(branchId);
            if (!localSession.length) {
                await syncTestFromSupabase(userId, branchId);
                localSession = await getOngoingTestSession(branchId);
            }
            setActiveTest(localSession[0] || null);

            let localHistory = await getCompletedTestSessions(branchId);

            if (localHistory.length === 0) {
                const { data, error } = await fetchTestHistory(userId, branchId);
                if (error) console.error('Error fetching test history', error);
                else if (data && data.length > 0) {
                    const sessions = data as unknown as TestSession[];
                    await cacheTestSessions(sessions);
                    localHistory = sessions;
                }
            }

            setHistory(localHistory.slice(0, 10));
        } catch (error) {
            console.error('Failed to load topic test hub data:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, branchId]);

    useEffect(() => {
        void load();
    }, [load]);

    return { loading, activeTest, history, refresh: load };
};

export default useTopicTestHubData;
