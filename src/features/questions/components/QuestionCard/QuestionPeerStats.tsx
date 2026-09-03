import { ChartBar } from 'phosphor-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { formatTime } from '@/shared/utils/helper';
import type { Benchmark } from '../../api/questions';

type Props = {
    loading: boolean | undefined;
    message: string | null | undefined;
    data: Benchmark | null | undefined;
};

export default function QuestionPeerStats({ loading, message, data }: Props) {
    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator color="#64748b" size="small" />
                <Text style={s.mutedText}>Loading stats…</Text>
            </View>
        );
    }

    if (message) {
        return (
            <View style={s.emptyBox}>
                <ChartBar size={22} color="#64748b" weight="duotone" />
                <Text style={s.mutedText}>{message}</Text>
            </View>
        );
    }

    if (!data) return null;

    const total = data.total_attempts || 0;
    const correct = data.correct_attempts || 0;
    const correctPercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wrongPercent = 100 - correctPercent;

    return (
        <View style={s.card}>
            <View style={s.header}>
                <ChartBar size={18} color="#818cf8" weight="duotone" />
                <Text style={s.headerText}>Question Statistics</Text>
            </View>

            <View style={s.body}>
                <View style={s.legendRow}>
                    <Text style={s.correctText}>{correctPercent}% correct</Text>
                    <Text style={s.wrongText}>{wrongPercent}% wrong</Text>
                </View>
                <View style={s.track}>
                    <View style={[s.fillCorrect, { flex: correctPercent || 0 }]} />
                    <View style={[s.fillWrong, { flex: wrongPercent || 0 }]} />
                </View>

                <View style={s.grid}>
                    <View style={s.tile}>
                        <Text style={s.tileLabel}>Average time taken</Text>
                        <Text style={s.tileValue}>
                            {data.avg_time_seconds ? formatTime(data.avg_time_seconds) : '—'}
                        </Text>
                    </View>
                    <View style={s.tile}>
                        <Text style={s.tileLabel}>People attempted</Text>
                        <Text style={s.tileValue}>{total}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    centered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
    mutedText: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },
    emptyBox: {
        marginTop: 18, padding: 16, borderRadius: 10, alignItems: 'center', gap: 8,
        borderWidth: 1, borderStyle: 'dashed', borderColor: '#334155', backgroundColor: '#111c30',
    },
    card: { marginTop: 18, borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, overflow: 'hidden' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b',
    },
    headerText: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
    body: { padding: 14, gap: 14 },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    correctText: { color: '#4ade80', fontSize: 12, fontWeight: '600' },
    wrongText: { color: '#f87171', fontSize: 12, fontWeight: '600' },
    track: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#1e293b' },
    fillCorrect: { backgroundColor: '#22c55e' },
    fillWrong: { backgroundColor: '#ef4444' },
    grid: { flexDirection: 'row', gap: 10 },
    tile: { flex: 1, alignItems: 'center', gap: 4, padding: 12, borderRadius: 10, backgroundColor: '#111c30' },
    tileLabel: { color: '#64748b', fontSize: 11, textAlign: 'center' },
    tileValue: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
});
