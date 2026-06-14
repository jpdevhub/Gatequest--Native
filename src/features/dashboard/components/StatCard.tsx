import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  icon: React.ReactNode;
  title: string;
  value: string;
  accentColor: string;
  bgColor: string;
  barColor: string;
  delay?: number;
};

export default function StatCard({ icon, title, value, accentColor, bgColor, barColor, delay = 0 }: Props) {
  const numericValue = parseFloat(value) || 0;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
        <View style={styles.barTrack}>
          <Animated.View
            style={[styles.barFill, { width: `${Math.min(numericValue, 100)}%`, backgroundColor: barColor }]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  barTrack: { height: 4, backgroundColor: '#334155', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 99 },
});
