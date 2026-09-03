import { StyleSheet, Text, View } from 'react-native';
import type { Question } from '@/shared/types/storage';

export default function QuestionBadge({ currentQuestion }: { currentQuestion: Question }) {
    return (
        <View style={s.wrap}>
            <Text style={s.line}>ID: {currentQuestion.id || 'Unknown'}</Text>
            <Text style={s.line}>Subject: {currentQuestion.subject}</Text>
            <Text style={s.line}>Topic: {currentQuestion.topic}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        marginTop: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        gap: 2,
    },
    line: { color: '#475569', fontSize: 11 },
});
