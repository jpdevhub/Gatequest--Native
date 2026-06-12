import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStats } from '@/providers/StatsProvider';
import { useGoals } from '@/providers/GoalProvider';

/**
 * Dashboard screen — mirrors PWA DashboardPage.
 * Shows real data from StatsProvider / GoalProvider.
 *
 * TODO (next iteration): Add StatCard, StreakMap, StudyPlan, SubjectStats,
 * ContinueSessionWidget components — ported from PWA feature/dashboard/components/.
 */
export default function DashboardScreen() {
  const { stats, loading } = useStats();
  const { userGoal } = useGoals();

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>Dashboard</Text>

        {loading ? (
          <Text style={s.muted}>Loading stats…</Text>
        ) : (
          <View style={s.grid}>
            <StatRow label="Progress" value={`${stats.progress}%`} />
            <StatRow label="Accuracy" value={`${stats.accuracy}%`} />
            <StatRow label="Current Streak" value={`${stats.streaks.current} days`} />
            <StatRow label="Longest Streak" value={`${stats.streaks.longest} days`} />
            <StatRow label="Questions Attempted" value={`${stats.studyPlan.uniqueAttemptCount}`} />
            <StatRow label="Daily Target" value={`${stats.studyPlan.dailyQuestionTarget} Q`} />
            <StatRow label="Days Until GATE" value={`${stats.studyPlan.daysLeft}`} />
          </View>
        )}

        {userGoal && (
          <Text style={s.muted}>
            Branch: {userGoal.branch_id} | Exams: {(userGoal.target_exams as string[]).join(', ')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, gap: 12 },
  heading: { color: '#f1f5f9', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  grid: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: 14, borderRadius: 10 },
  label: { color: '#94a3b8', fontSize: 14 },
  value: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  muted: { color: '#475569', fontSize: 13, marginTop: 12 },
});
