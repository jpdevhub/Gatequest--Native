import { X } from 'phosphor-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Question } from '@/shared/types/storage';

type QuestionPaletteProps = {
    questions: Question[];
    currentIndex: number;
    isOpen: boolean;
    onToggle: () => void;
    onJumpTo: (index: number) => void;
    markedForReview: (id: string) => boolean;
    isAnswered: (id: string) => boolean;
    isVisited: (id: string) => boolean;
    answeredCount: number;
    markedCount: number;
    visitedNotAnswered: number;
    unvisitedCount: number;
};

const LEGEND = [
    { key: 'answered', label: 'Answered', color: '#22c55e' },
    { key: 'marked', label: 'Marked', color: '#a855f7' },
    { key: 'viewed', label: 'Not answered', color: '#ef4444' },
    { key: 'unvisited', label: 'Not visited', color: '#475569' },
];

export default function QuestionPalette({
    questions,
    currentIndex,
    isOpen,
    onToggle,
    onJumpTo,
    markedForReview,
    isAnswered,
    isVisited,
    answeredCount,
    markedCount,
    visitedNotAnswered,
    unvisitedCount,
}: QuestionPaletteProps) {
    const counts: Record<string, number> = {
        answered: answeredCount,
        marked: markedCount,
        viewed: visitedNotAnswered,
        unvisited: unvisitedCount,
    };

    return (
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onToggle}>
            <Pressable style={s.backdrop} onPress={onToggle}>
                <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                    <View style={s.grabber} />
                    <View style={s.header}>
                        <Text style={s.title}>Question palette</Text>
                        <Pressable onPress={onToggle} hitSlop={12}>
                            <X size={18} color="#94a3b8" weight="bold" />
                        </Pressable>
                    </View>

                    <View style={s.legend}>
                        {LEGEND.map((item) => (
                            <View key={item.key} style={s.legendItem}>
                                <View style={[s.dot, { backgroundColor: item.color }]} />
                                <Text style={s.legendText}>
                                    {item.label} · {counts[item.key] ?? 0}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
                        {questions.map((question, index) => {
                            const answered = isAnswered(question.id);
                            const marked = markedForReview(question.id);
                            const visited = isVisited(question.id);

                            const style = marked
                                ? s.cellMarked
                                : answered
                                  ? s.cellAnswered
                                  : visited
                                    ? s.cellViewed
                                    : s.cellUnvisited;

                            return (
                                <Pressable
                                    key={question.id}
                                    style={[s.cell, style, index === currentIndex && s.cellCurrent]}
                                    onPress={() => {
                                        onJumpTo(index);
                                        onToggle();
                                    }}
                                >
                                    <Text style={s.cellText}>{index + 1}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.7)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#0f172a', borderTopLeftRadius: 22, borderTopRightRadius: 22,
        borderTopWidth: 1, borderColor: '#1e293b', paddingHorizontal: 20, paddingBottom: 24,
        maxHeight: '75%',
    },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#334155', marginTop: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
    title: { color: '#f1f5f9', fontSize: 17, fontWeight: '700' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    legendText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 16 },
    cell: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
    cellCurrent: { borderColor: '#f8fafc' },
    cellAnswered: { backgroundColor: '#16a34a' },
    cellMarked: { backgroundColor: '#9333ea' },
    cellViewed: { backgroundColor: '#dc2626' },
    cellUnvisited: { backgroundColor: '#334155' },
    cellText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
