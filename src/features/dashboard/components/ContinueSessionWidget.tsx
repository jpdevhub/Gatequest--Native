import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  BookmarkSimple, Target, Sliders, Eye, Heart, X, ArrowRight,
  Clock, ChartBar, BookOpen, Highlighter,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { storage } from '@/shared/utils/storageService';

const SESSION_KEY = 'gatequest_last_active_session';
const TS_KEY = 'gatequest_last_active_timestamp';

function formatSlug(s: string) {
  return s.split('-').map((w) => w.toUpperCase()).join(' ');
}

export default function ContinueSessionWidget() {
  const router = useRouter();
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = storage.get<string>(SESSION_KEY);
    const ts = storage.get<number>(TS_KEY);
    if (url && ts && Date.now() - ts < 3 * 24 * 60 * 60 * 1000) {
      setSessionUrl(url);
    }
  }, []);

  if (!sessionUrl) return null;

  const [pathPart, searchPart] = sessionUrl.split('?');
  const segments = pathPart?.split('/').filter(Boolean) || [];
  const qp = new URLSearchParams(searchPart || '');
  const isBookmark = qp.get('bookmark') === 'true' || qp.get('bookmarked') === 'true';

  let title = 'Continue Learning';
  let subtitle = 'Pick up exactly where you paused.';
  let badge = 'Resume';
  let Icon: any = BookOpen;
  let accent = '#60a5fa';
  let iconBg = 'rgba(59,130,246,0.12)';
  let badgeBg = 'rgba(59,130,246,0.12)';

  if (segments[0] === 'practice') {
    accent = '#60a5fa'; iconBg = 'rgba(59,130,246,0.12)'; badgeBg = iconBg;
    if (isBookmark && segments[1]) {
      title = `Bookmarked: ${formatSlug(segments[1])}`; badge = 'Bookmarks'; Icon = BookmarkSimple;
    } else if (segments[1] && segments[2]) {
      title = `${formatSlug(segments[1])} • Active`; badge = 'Solving PYQ'; Icon = Target;
    } else if (segments[1]) {
      title = `${formatSlug(segments[1])} Pool`; badge = 'Question List'; Icon = BookOpen;
    } else {
      title = 'Practice Arena'; subtitle = 'Welcome back soldier, today we fight silly little MCQs again.'; badge = 'Practice Hub'; Icon = BookOpen;
    }
  } else if (segments[0] === 'revision') {
    accent = '#fb923c'; iconBg = 'rgba(249,115,22,0.12)'; badgeBg = iconBg;
    if (segments[1] && segments[2]) {
      title = 'Smart Revision Card'; badge = 'Revision Card'; Icon = Target;
    } else if (segments[1]) {
      title = 'Smart Revision List'; badge = 'Revision Queue'; Icon = Highlighter;
    } else {
      title = 'Smart Revision Center'; badge = 'Revision Hub'; Icon = Highlighter;
    }
  } else if (['topic-test', 'topic-test-generate', 'topic-test-result', 'topic-test-review'].includes(segments[0])) {
    accent = '#f87171'; iconBg = 'rgba(239,68,68,0.12)'; badgeBg = iconBg;
    if (segments[0] === 'topic-test-generate') { title = 'Configure Mock Paper'; badge = 'Test Setup'; Icon = Sliders; }
    else if (segments[0] === 'topic-test-result') { title = 'Review Performance'; badge = 'Score Card'; Icon = ChartBar; }
    else if (segments[0] === 'topic-test-review') { title = 'Analyzing Solutions'; badge = 'Solution Audit'; Icon = Eye; }
    else { title = 'Topic Test Center'; badge = 'Test Hub'; Icon = Clock; }
  } else if (segments[0] === 'donate') {
    accent = '#4ade80'; iconBg = 'rgba(34,197,94,0.12)'; badgeBg = iconBg;
    title = 'Support GATEQuest'; badge = 'Contribution'; Icon = Heart;
  }

  const handleResume = () => router.push(sessionUrl as any);
  const handleClear = () => {
    storage.delete(SESSION_KEY);
    storage.delete(TS_KEY);
    setSessionUrl(null);
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(500)}>
      <Text style={styles.sectionLabel}>CONTINUE WHERE YOU LEFT OFF</Text>
      <Pressable style={styles.card} onPress={handleResume}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Icon size={22} color={accent} weight="duotone" />
        </View>
        <View style={styles.body}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{badge.toUpperCase()}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.resumeBtn} onPress={handleResume}>
            <Text style={styles.resumeText}>Resume</Text>
            <ArrowRight size={14} color="#0f172a" weight="bold" />
          </Pressable>
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <X size={16} color="#64748b" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  title: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  subtitle: { color: '#64748b', fontSize: 11, marginTop: 2 },
  actions: { alignItems: 'center', gap: 8 },
  resumeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  resumeText: { color: '#0f172a', fontSize: 12, fontWeight: '600' },
  clearBtn: { padding: 4 },
});
