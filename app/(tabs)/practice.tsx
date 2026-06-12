import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Practice tab — subject list entry point.
 * TODO: Port PracticePage → subject list using SubjectCard components.
 * Tapping a subject navigates to app/practice/[subject].tsx (PracticeList).
 * PWA source: src/features/practice/pages/PracticePage.tsx
 */
export default function PracticeScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.heading}>Practice</Text>
        <Text style={s.sub}>Subject list coming soon.</Text>
        <Text style={s.note}>PWA ref: features/practice/pages/PracticePage.tsx</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, padding: 20, gap: 8 },
  heading: { color: '#f1f5f9', fontSize: 26, fontWeight: 'bold' },
  sub: { color: '#94a3b8', fontSize: 15 },
  note: { color: '#475569', fontSize: 12, marginTop: 8 },
});
