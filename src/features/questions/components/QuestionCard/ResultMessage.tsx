import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import RichText from '@/shared/components/RichText';
import type { Question } from '@/shared/types/storage';
import { getCorrectAnswerText, isNumericalQuestion } from '../../utils/questionUtils';

type ResultMessageProps = {
    showAnswer: boolean;
    result: 'correct' | 'incorrect' | 'unattempted';
    currentQuestion: Question;
    numericalAnswer: number | null;
};

const TONE = {
    correct: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', text: '#4ade80' },
    incorrect: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#f87171' },
    unattempted: { bg: 'rgba(234,179,8,0.12)', border: '#eab308', text: '#facc15' },
};

export default function ResultMessage({
    showAnswer,
    result,
    currentQuestion,
    numericalAnswer,
}: ResultMessageProps) {
    if (!showAnswer) return null;

    const correctAnswer = getCorrectAnswerText(currentQuestion);
    const isNAT = isNumericalQuestion(currentQuestion);
    const tone = TONE[result];

    return (
        <Animated.View
            entering={FadeInDown.duration(260)}
            style={[s.box, { backgroundColor: tone.bg, borderLeftColor: tone.border }]}
        >
            {result === 'correct' ? (
                <Text style={[s.title, { color: tone.text }]}>Correct! Well done.</Text>
            ) : (
                <View style={s.body}>
                    <Text style={[s.title, { color: tone.text }]}>
                        {result === 'incorrect' ? 'Incorrect.' : 'Skipped.'} The correct answer is:
                    </Text>
                    <RichText text={correctAnswer} fontSize={15} textStyle={{ color: tone.text }} />
                    {isNAT && result === 'incorrect' && (
                        <Text style={[s.sub, { color: tone.text }]}>
                            Your answer: {numericalAnswer ?? '—'}
                        </Text>
                    )}
                </View>
            )}
        </Animated.View>
    );
}

const s = StyleSheet.create({
    box: {
        marginTop: 18,
        padding: 14,
        borderRadius: 10,
        borderLeftWidth: 4,
    },
    body: { gap: 4 },
    title: { fontSize: 14, fontWeight: '700' },
    sub: { fontSize: 13, opacity: 0.9 },
});
