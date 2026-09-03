import { useEffect, useState } from 'react';
import { readDoc, updateDoc } from '@/shared/storage/appStorage';
import { type Benchmark, fetchQuestionPeerStats } from '../api/questions';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_DOC = 'peer_benchmarks';
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CacheEntry = { data: Benchmark | null; fetched_at: number };
type CacheMap = Record<string, CacheEntry>;

export function usePeerBenchmark(questionId: string | number) {
    const [benchmarkDetails, setBenchmarkDetails] = useState<Benchmark | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const id = String(questionId);
        if (!UUID_REGEX.test(id)) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setBenchmarkDetails(null);
        setMessage(null);

        const load = async () => {
            try {
                setLoading(true);

                const cached = readDoc<CacheMap>(CACHE_DOC, {})[id];
                if (cached && Date.now() - cached.fetched_at < CACHE_TTL_MS) {
                    if (!isMounted) return;
                    if (cached.data) setBenchmarkDetails(cached.data);
                    else setMessage('You are the first to attempt this question!');
                    setLoading(false);
                    return;
                }

                const { data, error } = await fetchQuestionPeerStats(id);

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching peer benchmark:', error);
                    if (isMounted) setLoading(false);
                    return;
                }

                if (isMounted) {
                    if (!data) setMessage('You are the first to attempt this question!');
                    else setBenchmarkDetails(data);
                }

                updateDoc<CacheMap>(CACHE_DOC, {}, (current) => ({
                    ...current,
                    [id]: { data: data ?? null, fetched_at: Date.now() },
                }));
            } catch (err) {
                console.error('Failed to load benchmark:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void load();
        return () => {
            isMounted = false;
        };
    }, [questionId]);

    return { benchmarkDetails, loading, message };
}
