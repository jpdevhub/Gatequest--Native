import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { Stats } from '@/shared/types/Stats';

type Props = { stats: Stats };

const COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

function getWeeks(data: { date: string; count: number }[]) {
  const map: Record<string, number> = {};
  data.forEach((d) => (map[d.date] = d.count));

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6 * 7);

  const weeks: { date: string; level: number }[][] = [];
  let week: { date: string; level: number }[] = [];

  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const count = map[iso] || 0;
    const norm = count / maxCount;
    const level = norm > 0.8 ? 4 : norm > 0.6 ? 3 : norm > 0.4 ? 2 : norm > 0 ? 1 : 0;
    week.push({ date: iso, level });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);
  return weeks;
}

export default function StreakMap({ stats }: Props) {
  const weeks = getWeeks(stats.heatmapData || []);

  return (
    <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.card}>
      <Text style={styles.heading}>Streak Map</Text>
      <View style={styles.streakRow}>
        <Text style={styles.streakLabel}>
          Longest: <Text style={styles.yellow}>{stats.streaks.study_longest}</Text>
        </Text>
        <Text style={styles.streakLabel}>
          Current: <Text style={styles.green}>{stats.streaks.study_current}</Text>
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-start' }} style={styles.scroll}>
        <View style={styles.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekCol}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={[styles.cell, { backgroundColor: COLORS[day.level] }]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {COLORS.map((c) => (
          <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heading: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  streakRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  streakLabel: { color: '#94a3b8', fontSize: 13 },
  yellow: { color: '#eab308', fontWeight: '700' },
  green: { color: '#22c55e', fontWeight: '700' },
  scroll: { marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 3 },
  weekCol: { flexDirection: 'column', gap: 3 },
  cell: { width: 14, height: 14, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  legendText: { color: '#64748b', fontSize: 10 },
});
