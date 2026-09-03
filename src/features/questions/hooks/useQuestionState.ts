// Manages all local state for a single question: selection, reveal, and result.
// Direct port of the PWA hook; the numerical handler takes a string because
// React Native's TextInput has no valueAsNumber.
import { useCallback, useEffect, useState } from 'react';
import type { Question } from '@/shared/types/storage';
import { isMultipleSelection } from '../utils/questionUtils';

export const useQuestionState = (currentQuestion: Question) => {
    const [userAnswerIndex, setUserAnswerIndex] = useState<number | null>(null);
    const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]);
    const [numericalAnswer, setNumericalAnswer] = useState<number | null>(null);
    const [numericalText, setNumericalText] = useState('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [result, setResult] = useState<'correct' | 'incorrect' | 'unattempted'>('unattempted');

    const handleNumericalInputChange = (value: string) => {
        if (showAnswer) return;
        setNumericalText(value);
        const parsed = value.trim() === '' ? null : Number(value);
        setNumericalAnswer(parsed !== null && Number.isNaN(parsed) ? null : parsed);
    };

    const handleOptionSelect = (index: number) => {
        if (showAnswer) return;

        if (isMultipleSelection(currentQuestion)) {
            setSelectedOptionIndices((prev) =>
                prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
            );
        } else {
            const newIndex = userAnswerIndex === index ? null : index;
            setUserAnswerIndex(newIndex);
            setSelectedOptionIndices(newIndex !== null ? [newIndex] : []);
        }
    };

    const reset = useCallback(() => {
        setUserAnswerIndex(null);
        setSelectedOptionIndices([]);
        setNumericalAnswer(null);
        setNumericalText('');
        setShowAnswer(false);
        setResult('unattempted');
    }, []);

    useEffect(() => {
        reset();
    }, [currentQuestion?.id, reset]);

    return {
        userAnswerIndex,
        selectedOptionIndices,
        numericalAnswer,
        numericalText,
        setNumericalAnswer,
        showAnswer,
        setShowAnswer,
        result,
        setResult,
        handleOptionSelect,
        resetState: reset,
        handleNumericalInputChange,
    };
};
