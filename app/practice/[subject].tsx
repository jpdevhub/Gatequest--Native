/**
 * app/practice/[subject].tsx
 * Question list for a given subject.
 * Shows all questions, allows pagination/scrolling, and navigates to specific questions.
 */
import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useMemo } from 'react';

import { getQuestionsBySubject } from '@/shared/utils/questionStore';
import type { NormQuestion } from '@/shared/types/Question';

// Colors for difficulty badges
const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  Easy: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80' }, // Green
  Medium: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15' }, // Yellow
  Hard: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' }, // Red
};

// ── Question Card Component ──────────────────────────────────────────────────
function QuestionListItem({ item, index, subject }: { item: NormQuestion; index: number; subject: string }) {
  const router = useRouter();
  
  // Safely handle missing data
  const safeQuestion = item.question || '';
  const safeExams = Array.isArray(item.exams) && item.exams.length > 0 ? item.exams : ['GATE'];
  
  // Format the exam info exactly like PWA
  const examInfo = item.year 
    ? `${safeExams.join(' / ').toUpperCase()} ${item.year}`
    : 'Year Unknown';
    
  const diffStyle = DIFF_COLORS[item.difficulty ?? 'Medium'] ?? DIFF_COLORS.Medium;
  
  // Clean up the text for preview (Instant, no lag)
  const previewText = safeQuestion
    .replace(/<[^>]+>/g, '') // strip HTML
    .replace(/\\leq/g, '<=')
    .replace(/\\geq/g, '>=')
    .replace(/\\times/g, 'x')
    .replace(/\\sqrt/g, 'sqrt')
    .replace(/\$([^$]+)\$/g, '$1') // convert inline math $x$ to x
    .replace(/\\[a-zA-Z]+/g, '') // strip remaining \commands (like \Delta, \begin)
    .replace(/[{}]/g, '') // strip brackets
    .trim()
    .substring(0, 120);

  const handlePress = () => {
    // Navigates to the question detail screen (Phase 4.4)
    router.push(`/practice/${encodeURIComponent(subject)}/${encodeURIComponent(item.id)}` as any);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
      <Pressable style={s.card} onPress={handlePress}>
        <Text style={s.previewText} numberOfLines={3}>
          {previewText}{safeQuestion.length > 120 ? '...' : ''}
        </Text>
        
        <View style={s.cardFooter}>
          <View style={[s.diffBadge, { backgroundColor: diffStyle.bg }]}>
            <Text style={[s.diffBadgeText, { color: diffStyle.text }]}>{item.difficulty || 'Medium'}</Text>
          </View>
          <Text style={s.examText}>{examInfo}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function SubjectQuestionsScreen() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const router = useRouter();

  const decodedSubject = decodeURIComponent(subject ?? '');

  const questions = useMemo(
    () => getQuestionsBySubject(decodedSubject),
    [decodedSubject],
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={s.header}>
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)/practice' as any);
            }
          }} 
          style={s.backBtn} 
          hitSlop={12}
        >
          <ArrowLeft size={20} color="#94a3b8" weight="bold" />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.title} numberOfLines={1}>{decodedSubject}</Text>
          <Text style={s.subtitle}>{questions.length} questions available</Text>
        </View>
      </Animated.View>

      {/* Question list */}
      <FlatList
        data={questions}
        keyExtractor={(q, index) => q.id + '-' + index}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={({ item, index }) => (
          <QuestionListItem 
            item={item} 
            index={Math.min(index, 10)} // Cap animation delay
            subject={decodedSubject} 
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No questions found for this subject.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
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
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#475569', fontSize: 12, marginTop: 2 },

  list: { padding: 16, paddingBottom: 100, gap: 12 },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewText: {
    color: '#f1f5f9',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  examText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
  },
});
