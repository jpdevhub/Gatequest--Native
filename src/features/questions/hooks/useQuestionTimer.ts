// Per-question stopwatch. Port of the PWA hook with setInterval instead of window.setInterval.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Question } from '@/shared/types/storage';

export const useQuestionTimer = (
    autoTimer = false,
    currentQuestion?: Question,
    isAnswered = false
) => {
    const [isActive, setIsActive] = useState(autoTimer);
    const [time, setTime] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = useCallback(() => {
        if (intervalRef.current) return;
        setIsActive(true);
        intervalRef.current = setInterval(() => setTime((prev) => prev + 1), 1000);
    }, []);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsActive(false);
    }, []);

    const reset = useCallback(() => {
        stop();
        setTime(0);
    }, [stop]);

    const toggle = () => {
        if (isActive) stop();
        else start();
    };

    useEffect(() => {
        if (isAnswered) {
            stop();
            return;
        }
        if (autoTimer) {
            reset();
            start();
        } else {
            reset();
        }
        return () => {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
        };
    }, [currentQuestion?.id, autoTimer, reset, start, stop, isAnswered]);

    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');

    return { time, minutes, seconds, isActive, toggle, stop, reset };
};
