import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGoals } from '@/providers/GoalProvider';
import { readDoc, updateDoc } from '@/shared/storage/appStorage';
import { fetchTopicCounts } from '../api/topicTest';

const CACHE_TTL = 1000 * 60 * 60;
const CACHE_DOC = 'topic_counts';

export interface Topic {
    name: string;
    subjectName: string | undefined;
    subjectId: string;
    questionCount: number;
    unattemptedCount: number;
}

type CacheMap = Record<string, { timestamp: number; data: Topic[] }>;

interface UseTopicTestGeneratorParams {
    subjectId: string | null;
    requestedQuestionCount: number;
    includeAttempted: boolean;
}

export const useTopicTestGenerator = ({
    subjectId,
    requestedQuestionCount,
    includeAttempted,
}: UseTopicTestGeneratorParams) => {
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    const { getPracticeSubjects } = useGoals();
    const subjectName = getPracticeSubjects().find((s) => s.id === subjectId)?.name as
        | string
        | undefined;

    const fetchTopics = useCallback(
        async (force = false) => {
            if (!subjectId) return;

            const cached = readDoc<CacheMap>(CACHE_DOC, {})[subjectId];
            if (!force && cached && Date.now() - cached.timestamp <= CACHE_TTL) {
                setAvailableTopics(cached.data);
                return;
            }

            setLoading(true);
            const { data, error } = await fetchTopicCounts(subjectId);

            if (error || !data) {
                console.error(error);
                setAvailableTopics(cached?.data ?? []);
            } else {
                const topics: Topic[] = data.map((t) => ({
                    name: t.topic,
                    subjectName,
                    subjectId,
                    questionCount: t.question_count,
                    unattemptedCount: t.unattempted_count,
                }));

                setAvailableTopics(topics);
                updateDoc<CacheMap>(CACHE_DOC, {}, (current) => ({
                    ...current,
                    [subjectId]: { timestamp: Date.now(), data: topics },
                }));
            }

            setLoading(false);
        },
        [subjectId, subjectName]
    );

    useEffect(() => {
        setSelectedTopics([]);
        void fetchTopics();
    }, [fetchTopics]);

    const toggleTopic = (topic: Topic) => {
        setSelectedTopics((prev) => {
            const exists = prev.find(
                (t) => t.name === topic.name && t.subjectId === topic.subjectId
            );
            if (exists) {
                return prev.filter(
                    (t) => !(t.name === topic.name && t.subjectId === topic.subjectId)
                );
            }
            return [...prev, topic];
        });
    };

    /** Bulk select/deselect in one state update, rather than N toggles. */
    const toggleMany = (topics: Topic[], select: boolean) => {
        setSelectedTopics((prev) => {
            if (!select) {
                return prev.filter(
                    (t) => !topics.some((x) => x.name === t.name && x.subjectId === t.subjectId)
                );
            }
            const merged = [...prev];
            for (const topic of topics) {
                const exists = merged.some(
                    (t) => t.name === topic.name && t.subjectId === topic.subjectId
                );
                if (!exists) merged.push(topic);
            }
            return merged;
        });
    };

    const removeTopic = (topicName: string) =>
        setSelectedTopics((prev) => prev.filter((t) => t.name !== topicName));

    const clearSelection = () => setSelectedTopics([]);

    const poolSize = useMemo(
        () =>
            selectedTopics.reduce(
                (sum, t) => sum + (includeAttempted ? t.questionCount : t.unattemptedCount),
                0
            ),
        [selectedTopics, includeAttempted]
    );

    const canGenerate = poolSize > 0 && poolSize >= requestedQuestionCount;

    useEffect(() => {
        const w: string[] = [];
        if (selectedTopics.length > 0 && poolSize < requestedQuestionCount) {
            w.push(
                `Selected topics contain only ${poolSize}/${requestedQuestionCount} questions.`
            );
        }
        setWarnings(w);
    }, [poolSize, requestedQuestionCount, selectedTopics.length]);

    return {
        availableTopics,
        selectedTopics,
        poolSize,
        loading,
        warnings,
        canGenerate,
        toggleTopic,
        toggleMany,
        removeTopic,
        clearSelection,
        refreshCache: () => fetchTopics(true),
    };
};
