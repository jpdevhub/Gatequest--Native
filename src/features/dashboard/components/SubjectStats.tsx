import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import SubjectIcon from '@/shared/components/SubjectIcon';
import { getSubjectColors } from '@/shared/data/subjectIcons';
import type { SubjectStat } from '@/shared/types/Stats';


type Props = { subjectStats: SubjectStat[] };

export default function SubjectStats({ subjectStats }: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.wrapper}>
      <Text style={styles.heading}>Subject Stats</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-start' }}>
        <View style={styles.row}>
          {subjectStats.map((s, i) => {
            const progress = Number(s.progress) || 0;
            const accuracy = Number(s.accuracy) || 0;
            const theme = getSubjectColors(s.theme_color);

            return (
              <Pressable key={i} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
                  <SubjectIcon name={s.icon_name} size={22} color={theme.fg} />
                </View>
                <Text style={styles.subjectName}>{s.subject_name}</Text>

                <Text style={styles.barLabel}>Progress</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress}%`, backgroundColor: '#3b82f6' }]} />
                </View>
                <Text style={styles.barHint}>{progress}% complete</Text>

                <Text style={styles.barLabel}>Accuracy</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${accuracy}%`, backgroundColor: '#22c55e' }]} />
                </View>
                <Text style={styles.barHint}>{accuracy}% correct</Text>

                <View style={styles.meta}>
                  <Text style={styles.metaText}>Attempted: <Text style={styles.bold}>{s.attempted}</Text></Text>
                  <Text style={styles.metaText}>Total: <Text style={styles.bold}>{s.total_available ?? '—'}</Text></Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  heading: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  card: {
    width: 220,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  subjectName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  barLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 4 },
  track: { height: 6, backgroundColor: '#334155', borderRadius: 99, overflow: 'hidden', marginBottom: 2 },
  fill: { height: 6, borderRadius: 99 },
  barHint: { color: '#64748b', fontSize: 10, marginBottom: 10 },
  meta: { marginTop: 4, gap: 2 },
  metaText: { color: '#64748b', fontSize: 11 },
  bold: { color: '#94a3b8', fontWeight: '700' },
});
