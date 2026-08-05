/**
 * app/practice/[subject].tsx
 * Topic list for a given subject — shows topics with question counts.
 * Tap a topic → navigate to the question list.
 */
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  View, Text, StyleSheet, FlatList, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Stack } from 'phosphor-react-native';
import { useMemo } from 'react';
import { getTopicsForSubject } from '@/shared/utils/questionStore';
import type { TopicMeta } from '@/shared/utils/questionStore';

const DIFF_COLOR: Record<string, string> = {
  Easy:   '#4ade80',
  Medium: '#facc15',
  Hard:   '#f87171',
};

function TopicRow({ item, index, subject }: { item: TopicMeta; index: number; subject: string }) {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        style={s.row}
        onPress={() =>
          router.push(`/practice/${encodeURIComponent(subject)}/${encodeURIComponent(item.topic)}` as any)
        }
      >
        <View style={s.rowLeft}>
          <View style={s.iconCircle}>
            <Stack size={16} color="#3b82f6" weight="duotone" />
          </View>
          <View style={s.rowText}>
            <Text style={s.topicName}>{item.topic}</Text>
            <Text style={s.topicCount}>{item.count} questions</Text>
          </View>
        </View>
        <ArrowRight size={16} color="#334155" weight="bold" />
      </Pressable>
    </Animated.View>
  );
}

export default function SubjectTopicsScreen() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const router = useRouter();

  const topics = useMemo(
    () => getTopicsForSubject(decodeURIComponent(subject ?? '')),
    [subject],
  );

  const totalQuestions = useMemo(
    () => topics.reduce((sum, t) => sum + t.count, 0),
    [topics],
  );

  const decodedSubject = decodeURIComponent(subject ?? '');

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <ArrowLeft size={20} color="#94a3b8" weight="bold" />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.title} numberOfLines={1}>{decodedSubject}</Text>
          <Text style={s.subtitle}>{topics.length} topics · {totalQuestions} questions</Text>
        </View>
      </Animated.View>

      {/* Topic list */}
      <FlatList
        data={topics}
        keyExtractor={(t) => t.topic}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TopicRow item={item} index={index} subject={decodedSubject} />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No topics found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#475569', fontSize: 12, marginTop: 2 },

  list: { padding: 16, paddingBottom: 100, gap: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  topicName: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  topicCount: { color: '#475569', fontSize: 12, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#475569', fontSize: 14 },
});
