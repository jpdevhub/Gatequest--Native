import { useEffect, useRef, useState } from 'react';
import { formatTime } from '@/shared/utils/helper';

interface UseTestTimerProps {
    initialSeconds: number;
    onExpire?: () => void;
}

/**
 * Wall-clock countdown. The target time is captured once so backgrounding the app
 * cannot make the test longer than it should be.
 */
const useTestTimer = ({ initialSeconds, onExpire }: UseTestTimerProps) => {
    const targetTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onExpireRef = useRef<(() => void) | undefined>(onExpire);
    const hasExpiredRef = useRef(false);

    const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        if (!targetTimeRef.current) targetTimeRef.current = Date.now() + initialSeconds * 1000;

        const tick = () => {
            if (!targetTimeRef.current) return;
            const nextSeconds = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
            setSecondsRemaining(nextSeconds);

            if (nextSeconds === 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                setIsExpired(true);
                onExpireRef.current?.();
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        };

        tick();
        intervalRef.current = setInterval(tick, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // initialSeconds does not change mid-test.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        timeDisplay: formatTime(secondsRemaining),
        secondsRemaining,
        isExpired,
    };
};

export default useTestTimer;
