import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Topic Test hub stub.
 * TODO: Port TopicTest page → test list + generate CTA.
 * PWA source: src/features/topic-test/pages/TopicTest.tsx
 * Test session (fullScreenModal): app/topic-test/[testId]/attempt.tsx
 */
export default function TopicTestScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.heading}>Topic Test</Text>
        <Text style={s.sub}>Test hub coming soon.</Text>
        <Text style={s.note}>PWA ref: features/topic-test/pages/TopicTest.tsx</Text>
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
