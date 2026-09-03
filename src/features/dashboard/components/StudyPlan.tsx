import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet } from 'react-native';
import { useStats } from '@/providers/StatsProvider';

export default function StudyPlan() {
  const { stats, loading } = useStats();
  if (loading) return null;

  const { dailyQuestionTarget, todayUniqueAttemptCount } = stats.studyPlan;
  // Today's progress must use today's count, not the lifetime total.
  const todayCount = todayUniqueAttemptCount;
  const percent = dailyQuestionTarget > 0 ? Math.min(100, Math.round((todayCount / dailyQuestionTarget) * 100)) : 0;
  const isMet = percent >= 100;
  const remaining = Math.max(0, dailyQuestionTarget - todayCount);

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Smart Study Plan</Text>
          <Text style={styles.sub}>{stats.studyPlan.daysLeft} days left until exam</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.row}>
        <Text style={styles.label}>Today's progress</Text>
        <Text style={styles.count}>{todayCount} / {dailyQuestionTarget}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: `${percent}%`,
              backgroundColor: isMet ? '#1d4ed8' : '#60a5fa',
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.hint}>{percent}% of today's goal</Text>
        <Text style={styles.hint}>{isMet ? 'Target met ✓' : `Need ${remaining} more`}</Text>
      </View>

      {/* Status banner */}
      <View style={[styles.banner, isMet ? styles.bannerGreen : styles.bannerYellow]}>
        <Text style={[styles.bannerText, isMet ? styles.bannerTextGreen : styles.bannerTextYellow]}>
          {isMet
            ? "Great job! You've met today's target."
            : `Attempt ${remaining} more unique questions to stay on track.`}
        </Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heading: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  sub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#cbd5e1', fontSize: 13 },
  count: { color: '#94a3b8', fontSize: 13 },
  hint: { color: '#64748b', fontSize: 11 },
  track: { height: 10, backgroundColor: '#334155', borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  fill: { height: 10, borderRadius: 99 },
  banner: { marginTop: 14, borderRadius: 10, padding: 12 },
  bannerGreen: { backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: '#166534' },
  bannerYellow: { backgroundColor: 'rgba(234,179,8,0.1)', borderWidth: 1, borderColor: '#854d0e' },
  bannerText: { textAlign: 'center', fontSize: 13, fontWeight: '500' },
  bannerTextGreen: { color: '#86efac' },
  bannerTextYellow: { color: '#fde047' },
});
