import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Smart Revision tab stub.
 * TODO: Port SmartRevisionPage → revision set list.
 * PWA source: src/features/smart-revision/pages/SmartRevisionPage.tsx
 */
export default function RevisionScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.heading}>Smart Revision</Text>
        <Text style={s.sub}>Revision sets coming soon.</Text>
        <Text style={s.note}>PWA ref: features/smart-revision/pages/SmartRevisionPage.tsx</Text>
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
