import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { isMultipleSelection } from '@/features/questions/utils/questionUtils';
import HtmlView, { type HtmlViewHandle } from '@/shared/components/renderers/HtmlView';
import { buildContentHtml } from '@/shared/components/renderers/contentHtml';
import { buildDocument } from '@/shared/components/renderers/webviewShell';
import type { Question } from '@/shared/types/storage';

const CLOUDINARY = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

type QuestionContentProps = {
    env: 'Test' | 'Practice';
    currentQuestion: Question;
    hasOptions: boolean;
    showAnswer: boolean;
    selectedOptionIndices: number[];
    userAnswerIndex: number | null;
    onOptionSelect?: ((index: number) => void) | undefined;
};

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Renders the question body and its options as one document.
 *
 * Keeping both together is what makes this fast: a question with four LaTeX
 * options would otherwise need five separate renderers. Selection state is
 * pushed in with `applyState` rather than rebuilding the document, so tapping an
 * option never reloads or re-typesets anything.
 */
function QuestionContent({
    env,
    currentQuestion,
    hasOptions,
    showAnswer,
    selectedOptionIndices,
    userAnswerIndex,
    onOptionSelect,
}: QuestionContentProps) {
    const viewRef = useRef<HtmlViewHandle>(null);
    const [ready, setReady] = useState(false);
    const [height, setHeight] = useState(220);

    const isMSQ = isMultipleSelection(currentQuestion);
    const options = useMemo(
        () => (hasOptions ? currentQuestion.options ?? [] : []),
        [hasOptions, currentQuestion.options]
    );

    const html = useMemo(() => {
        const body = currentQuestion.question
            ? buildContentHtml(currentQuestion.question, CLOUDINARY)
            : '<p>Question content unavailable</p>';

        const optionsHtml = options.length
            ? `<div class="opts">${options
                  .map((option, index) => {
                      const label =
                          env === 'Practice'
                              ? `<span class="label">${OPTION_LABELS[index] ?? index + 1}</span>`
                              : '';
                      const markClass = isMSQ ? 'mark check' : 'mark radio';
                      return `<div class="opt" data-i="${index}" data-locked="0"><span class="${markClass}"></span>${label}<div class="body">${
                          option ? buildContentHtml(option, CLOUDINARY) : 'Option unavailable'
                      }</div></div>`;
                  })
                  .join('')}</div>`
            : '';

        return buildDocument(`${body}${optionsHtml}`, 15);
        // Rebuilt only when the question itself changes.
    }, [currentQuestion.id, currentQuestion.question, env, isMSQ, options]); // eslint-disable-line react-hooks/exhaustive-deps

    // A new document means a fresh load; wait for it before pushing state in.
    useEffect(() => {
        setReady(false);
    }, [html]);

    useEffect(() => {
        if (!ready) return;

        const correctAnswer = Array.isArray(currentQuestion.correct_answer)
            ? (currentQuestion.correct_answer as number[])
            : [];

        const classes: Record<number, string> = {};
        const marks: Record<number, string> = {};

        options.forEach((_option, index) => {
            const isSelected = isMSQ
                ? selectedOptionIndices.includes(index)
                : userAnswerIndex === index;
            const isCorrect = isMSQ ? correctAnswer.includes(index) : correctAnswer[0] === index;

            if (showAnswer) {
                if (isCorrect) classes[index] = 'correct';
                else if (isSelected) classes[index] = 'wrong';
                else classes[index] = '';
            } else {
                classes[index] = isSelected ? 'selected' : '';
            }

            marks[index] = isSelected || (showAnswer && isCorrect) ? '✓' : '';
        });

        viewRef.current?.applyState({ classes, marks, locked: showAnswer });
    }, [
        ready,
        showAnswer,
        userAnswerIndex,
        selectedOptionIndices,
        isMSQ,
        options,
        currentQuestion.correct_answer,
    ]);

    const onHeight = useCallback((h: number) => setHeight(h), []);
    const onReady = useCallback(() => setReady(true), []);
    const onSelect = useCallback(
        (index: number) => {
            if (!showAnswer) onOptionSelect?.(index);
        },
        [showAnswer, onOptionSelect]
    );

    return (
        <View style={[styles.wrap, { height }]}>
            <HtmlView
                ref={viewRef}
                html={html}
                onHeight={onHeight}
                onSelect={onSelect}
                onReady={onReady}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { width: '100%' },
});

export default React.memo(QuestionContent);
