import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lightning, ArrowClockwise, ChartLine, Medal } from 'phosphor-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useStats } from '@/providers/StatsProvider';
import { useGoals } from '@/providers/GoalProvider';
import StatCard from '@/features/dashboard/components/StatCard';
import StudyPlan from '@/features/dashboard/components/StudyPlan';
import StreakMap from '@/features/dashboard/components/StreakMap';
import SubjectStats from '@/features/dashboard/components/SubjectStats';
import ContinueSessionWidget from '@/features/dashboard/components/ContinueSessionWidget';
import { useMemo, useState } from 'react';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { stats, loading } = useStats();
  const { userGoal } = useGoals();
  const router = useRouter();

  const activeExams = useMemo(() => (userGoal?.target_exams as string[]) || [], [userGoal]);
  const [selectedExam, setSelectedExam] = useState(activeExams[0] || '');

  const subjectStats = useMemo(
    () => stats?.subjectStatsMap?.[selectedExam.toUpperCase()] || [],
    [stats, selectedExam],
  );

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.welcome}>
          <Text style={styles.welcomeText}>
            Welcome back,{' '}
            <Text style={styles.welcomeName}>{firstName}</Text>
          </Text>
          <Text style={styles.welcomeSub}>
            Your preparation journey is {stats?.progress ?? 0}% complete. Keep going!
          </Text>
        </Animated.View>

        {/* Continue Session */}
        <ContinueSessionWidget />

        {/* Smart Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.sectionLabel}>SMART ACTIONS</Text>
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBtn} onPress={() => router.push('/practice')}>
              <Lightning size={20} color="#fff" weight="fill" />
              <Text style={styles.actionText}>Topic Test</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => router.push('/practice')}>
              <ArrowClockwise size={20} color="#fff" weight="bold" />
              <Text style={styles.actionText}>Smart Revision</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Overview stat cards */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>OVERVIEW</Text>
        <StatCard
          icon={<ChartLine size={22} color="#3b82f6" weight="duotone" />}
          title="Overall Progress"
          value={`${stats?.progress ?? 0}%`}
          accentColor="#60a5fa"
          bgColor="rgba(59,130,246,0.12)"
          barColor="#3b82f6"
          delay={250}
        />
        <StatCard
          icon={<Medal size={22} color="#a855f7" weight="duotone" />}
          title="Overall Accuracy"
          value={`${stats?.accuracy ?? 0}%`}
          accentColor="#c084fc"
          bgColor="rgba(168,85,247,0.12)"
          barColor="#a855f7"
          delay={300}
        />

        {/* Study Plan */}
        <StudyPlan />

        {/* Streak Map */}
        {!loading && (stats?.heatmapData?.length ?? 0) > 0 && (
          <StreakMap stats={stats!} />
        )}

        {/* Exam switcher */}
        {activeExams.length > 1 && (
          <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.examRow}>
            {activeExams.map((exam) => (
              <Pressable
                key={exam}
                style={[styles.examTab, selectedExam === exam && styles.examTabActive]}
                onPress={() => setSelectedExam(exam)}
              >
                <Text style={[styles.examText, selectedExam === exam && styles.examTextActive]}>
                  {exam.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Subject Stats */}
        {subjectStats.length > 0 ? (
          <SubjectStats subjectStats={subjectStats} />
        ) : (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.empty}>
            <Text style={styles.emptyText}>No data yet for {selectedExam || 'this exam'}.</Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },

  welcome: { marginBottom: 24 },
  welcomeText: { color: '#f1f5f9', fontSize: 28, fontWeight: '800', lineHeight: 36 },
  welcomeName: { color: '#3b82f6' },
  welcomeSub: { color: '#64748b', fontSize: 14, marginTop: 4 },

  sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14,
  },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  examRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  examTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b',
  },
  examTabActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
  examText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  examTextActive: { color: '#60a5fa' },

  empty: {
    padding: 40, borderRadius: 14, borderWidth: 2,
    borderColor: '#334155', borderStyle: 'dashed', alignItems: 'center',
  },
  emptyText: { color: '#475569', fontSize: 14 },
});
