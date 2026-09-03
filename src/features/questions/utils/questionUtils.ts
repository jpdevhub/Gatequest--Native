import type { NumericalQuestion, Question } from '@/shared/types/storage';

// Difficulty badge colours (native equivalent of the PWA's Tailwind classes).
export const getDifficultyColors = (difficulty: string): { bg: string; text: string } => {
    const d = (difficulty || '').toLowerCase();

    if (d === 'easy') return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' };
    if (d === 'medium' || d === 'normal') return { bg: 'rgba(234,179,8,0.15)', text: '#facc15' };
    if (d === 'hard') return { bg: 'rgba(239,68,68,0.15)', text: '#f87171' };

    return { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
};

export const getDifficultyDisplayText = (difficulty?: string) => {
    if (!difficulty) return 'Unknown';
    const normalized = difficulty.toLowerCase() === 'normal' ? 'medium' : difficulty.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

// Determine if current question is a multiple selection question
export const isMultipleSelection = (currentQuestion: Question) => {
    if (!currentQuestion) return false;

    const isTypeMatch = currentQuestion.question_type
        ?.toLowerCase()
        .includes('multiple-select');

    const isTagMatch =
        currentQuestion.tags &&
        Array.isArray(currentQuestion.tags) &&
        currentQuestion.tags.some((tag) => {
            const t = tag.toLowerCase();
            return (
                t.includes('multiple-select') || t.includes('multiple select')
            );
        });

    return isTypeMatch || isTagMatch;
};

export function isNumericalQuestion(q: Question): q is NumericalQuestion {
    return q?.question_type?.toLowerCase().includes('numerical') ?? false;
}

export const getQuestionTypeText = (q: Question) => {
    const type = q.question_type?.toLowerCase().trim();
    if (!type) return 'Question';

    if (type.includes('numerical')) return 'Numerical Answer';
    if (type.includes('multiple-select') || isMultipleSelection(q))
        return 'Multiple Select Question';
    if (type.includes('multiple-choice')) return 'Multiple Choice Question';

    // Fallback: preserve original text as-is
    return q.question_type!;
};

// Get correct answer text
export const getCorrectAnswerText = (
    currentQuestion: Question
): number | number[] | string => {
    if (!currentQuestion) return '';

    try {
        if (isNumericalQuestion(currentQuestion)) {
            const spec = currentQuestion.correct_answer;
            switch (spec.type) {
                case 'exact':
                    return spec.value.toString();

                case 'multiple':
                    return spec.values.join(', ');

                case 'range':
                    return spec.inclusive !== false
                        ? `${spec.min} to ${spec.max} (inclusive)`
                        : `${spec.min} to ${spec.max} (exclusive)`;

                case 'tolerance':
                    return `${spec.value} ± ${spec.tolerance}`;
            }
        }

        if (
            isMultipleSelection(currentQuestion) &&
            Array.isArray(currentQuestion.correct_answer)
        ) {
            // For multiple selection, show all correct options
            const correctIndices = currentQuestion.correct_answer;
            if (Array.isArray(currentQuestion.options)) {
                const correctOptions = correctIndices
                    .map((index) => currentQuestion.options![index])
                    .filter(Boolean);
                return correctOptions.join(', ');
            }
        }

        if (
            Array.isArray(currentQuestion.correct_answer) &&
            currentQuestion.options &&
            Array.isArray(currentQuestion.options)
        ) {
            const index = currentQuestion.correct_answer[0];
            if (
                index !== undefined &&
                currentQuestion.options[index] !== undefined
            ) {
                return currentQuestion.options[index];
            }
        }

        return currentQuestion.correct_answer || 'Answer not available';
    } catch (error) {
        console.error('Error getting correct answer text:', error);
        return 'Answer not available';
    }
};

export const getQuestionDisplayText = (question: Question) => {
    if (!question?.question) return 'Question content unavailable';

    const maxLength = 120;
    if (question.question.length <= maxLength) {
        // Just return the raw string
        return question.question;
    }

    let truncated = question.question.substring(0, maxLength);

    // ... (the rest of the truncation logic remains the same)
    const openCount = (truncated.match(/\$/g) || []).length;
    if (openCount % 2 !== 0) {
        const lastDollarIndex = truncated.lastIndexOf('$');
        if (lastDollarIndex > 0) {
            truncated = truncated.substring(0, lastDollarIndex);
        }
    }

    // Return the final processed string
    return truncated + '...';
};
