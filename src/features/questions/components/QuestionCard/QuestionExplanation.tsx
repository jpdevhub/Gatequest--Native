import { StyleSheet, Text, View } from 'react-native';
import RichText from '@/shared/components/RichText';
import type { Question, RevisionQuestion } from '@/shared/types/storage';

export default function QuestionExplanation({
    question,
}: {
    question: Question | RevisionQuestion;
}) {
    const textToRender = question.answer_text;
    if (!textToRender) return null;

    return (
        <View style={s.wrap}>
            <Text style={s.heading}>Explanation</Text>
            <Text style={s.disclaimer}>
                This is AI-generated and may contain errors. If it seems incorrect or unclear,
                please report it.
            </Text>
            <RichText text={textToRender} fontSize={15} />
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        marginTop: 18,
        padding: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderRadius: 10,
    },
    heading: { color: '#60a5fa', fontSize: 17, fontWeight: '700', marginBottom: 4 },
    disclaimer: { color: '#f87171', fontSize: 11, fontStyle: 'italic', marginBottom: 10 },
});
